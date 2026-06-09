import asyncio
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, Request

from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_DASHBOARD

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(require_permission(PERM_DASHBOARD))])

# ── Period helpers ─────────────────────────────────────────────────────────────

def _date_range(period: str) -> tuple[datetime | None, datetime | None]:
    """Return (start, end) UTC datetimes for the requested period."""
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, None
    if period == "week":
        return now - timedelta(days=7), None
    if period == "month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), None
    if period == "3months":
        return now - timedelta(days=90), None
    if period == "year":
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0), None
    return None, None  # all time


def _match_stage(start: datetime | None, end: datetime | None) -> dict:
    """Build a $match filter for created_at."""
    if start is None and end is None:
        return {}
    cond: dict = {}
    if start:
        cond["$gte"] = start
    if end:
        cond["$lte"] = end
    return {"created_at": cond}


def _group_id(group_by: str) -> dict:
    """Build the MongoDB _id expression for grouping by day or month."""
    base = {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}}
    if group_by == "day":
        base["day"] = {"$dayOfMonth": "$created_at"}
    return base


def _period_key(gid: dict, group_by: str) -> str:
    """Convert a MongoDB group _id dict to a YYYY-MM or YYYY-MM-DD string."""
    y = gid.get("year", 0)
    m = gid.get("month", 0)
    if group_by == "day":
        d = gid.get("day", 0)
        return f"{y:04d}-{m:02d}-{d:02d}"
    return f"{y:04d}-{m:02d}"


# ── Aggregations ───────────────────────────────────────────────────────────────

async def _agg_orders(db, match: dict, group_by: str) -> dict[str, dict]:
    """Return {period_key: {orders, quantity, charges, server_cost}} from the orders collection."""
    pipeline: list[dict] = []
    if match:
        pipeline.append({"$match": match})
    pipeline.append({
        "$group": {
            "_id":         _group_id(group_by),
            "orders":      {"$sum": 1},
            "quantity":    {"$sum": "$quantity"},
            "charges":     {"$sum": "$charge"},
            "server_cost": {"$sum": {"$ifNull": ["$server_cost", 0]}},
        }
    })
    result: dict[str, dict] = {}
    async for doc in db["orders"].aggregate(pipeline):
        key = _period_key(doc["_id"], group_by)
        result[key] = {
            "orders":      doc.get("orders",      0),
            "quantity":    doc.get("quantity",     0),
            "charges":     doc.get("charges",      0.0),
            "server_cost": doc.get("server_cost",  0.0),
        }
    return result


async def _agg_payments(db, match: dict, group_by: str) -> dict[str, dict]:
    """Return {period_key: {payments, revenue}} from the payments collection."""
    pipeline: list[dict] = []
    if match:
        pipeline.append({"$match": match})
    pipeline.append({
        "$group": {
            "_id":      _group_id(group_by),
            "payments": {"$sum": 1},
            "revenue":  {
                "$sum": {
                    "$cond": [
                        {"$in": ["$status", ["paid", "Completed", "completed"]]},
                        "$amount",
                        0,
                    ]
                }
            },
        }
    })
    result: dict[str, dict] = {}
    async for doc in db["payments"].aggregate(pipeline):
        key = _period_key(doc["_id"], group_by)
        result[key] = {
            "payments": doc.get("payments", 0),
            "revenue":  doc.get("revenue",  0.0),
        }
    return result


async def _agg_tickets(db, match: dict, group_by: str) -> dict[str, dict]:
    """Return {period_key: {tickets, ticket_replies}} from the tickets collection."""
    pipeline: list[dict] = []
    if match:
        pipeline.append({"$match": match})
    pipeline.append({
        "$group": {
            "_id":            _group_id(group_by),
            "tickets":        {"$sum": 1},
            "ticket_replies": {"$sum": {"$size": {"$ifNull": ["$messages", []]}}},
        }
    })
    result: dict[str, dict] = {}
    async for doc in db["tickets"].aggregate(pipeline):
        key = _period_key(doc["_id"], group_by)
        result[key] = {
            "tickets":        doc.get("tickets",        0),
            "ticket_replies": doc.get("ticket_replies", 0),
        }
    return result


async def _fetch_payment_rows(db, match: dict, group_by: str) -> list[dict]:
    """Return individual payment records sorted newest-first for the detail table."""
    pipeline: list[dict] = []
    if match:
        pipeline.append({"$match": match})
    pipeline.append({"$sort": {"created_at": -1}})
    pipeline.append({
        "$project": {
            "created_at":    1,
            "user_email":    1,
            "user_username": 1,
            "amount":        1,
            "method":        1,
            "status":        1,
            "memo":          1,
        }
    })
    rows: list[dict] = []
    async for doc in db["payments"].aggregate(pipeline):
        amount = round(float(doc.get("amount", 0) or 0), 4)
        status = doc.get("status", "")
        revenue = amount if status.lower() in ("paid", "completed") else 0.0

        created_at = doc.get("created_at")
        if isinstance(created_at, datetime):
            period_key = created_at.strftime("%Y-%m") if group_by == "month" else created_at.strftime("%Y-%m-%d")
            time_str   = created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            period_key = str(created_at)[:10] if created_at else ""
            time_str   = ""

        user = doc.get("user_username") or doc.get("user_email") or "—"
        rows.append({
            "payment_id":     str(doc["_id"])[-8:].upper(),
            "period":         period_key,
            "time":           time_str,
            "user":           user,
            "method":         doc.get("method", "—"),
            "status":         status,
            "memo":           doc.get("memo", ""),
            "amount":         amount,
            # ReportRow-compatible fields
            "payments":       1,
            "revenue":        round(revenue, 4),
            "orders":         0,
            "quantity":       0,
            "charges":        amount,
            "server_price":   0,
            "profit":         0,
            "tickets":        0,
            "ticket_replies": 0,
            "refills":        0,
            "refill_quantity": 0,
        })
    return rows


async def _fetch_order_rows(db, match: dict, group_by: str) -> list[dict]:
    """Return individual order rows sorted newest-first for the detail table."""
    pipeline: list[dict] = []
    if match:
        pipeline.append({"$match": match})
    pipeline.append({"$sort": {"created_at": -1}})
    pipeline.append({
        "$project": {
            "created_at":   1,
            "service_name": {
                "$ifNull": [
                    {"$cond": [{"$gt": ["$category_name", ""]}, "$category_name", None]},
                    "$service_name",
                ]
            },
            "quantity":     1,
            "charge":       1,
            "server_cost":  {"$ifNull": ["$server_cost", 0]},
            "status":       1,
        }
    })
    rows: list[dict] = []
    async for doc in db["orders"].aggregate(pipeline):
        charges      = round(float(doc.get("charge", 0) or 0), 4)
        server_price = round(float(doc.get("server_cost", 0) or 0), 4)
        revenue      = round(charges - server_price, 4)

        created_at = doc.get("created_at")
        if isinstance(created_at, datetime):
            if group_by == "month":
                period_key = created_at.strftime("%Y-%m")
            else:
                period_key = created_at.strftime("%Y-%m-%d")
            time_str = created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            period_key = str(created_at)[:10] if created_at else ""
            time_str   = ""

        rows.append({
            "order_id":     str(doc["_id"])[-8:].upper(),
            "period":       period_key,
            "time":         time_str,
            "service_name": doc.get("service_name") or "—",
            "quantity":     doc.get("quantity", 0),
            "charges":      charges,
            "server_price": server_price,
            "revenue":      revenue,
            "status":       doc.get("status", ""),
            # ReportRow-compatible fields so TAB_COLS still work
            "orders":         1,
            "payments":       0,
            "profit":         revenue,
            "tickets":        0,
            "ticket_replies": 0,
            "refills":        0,
            "refill_quantity": 0,
        })
    return rows


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.get("")
async def get_reports(
    request: Request,
    period:   str = Query("today", pattern="^(today|week|month|3months|year|all)$"),
    group_by: str = Query("day",   pattern="^(day|month)$"),
) -> dict:
    """
    Return aggregated report data for the given period, grouped by day or month.

    Data is sourced from the live orders, payments, and tickets collections.
    server_price and refills are not yet tracked per-order and are returned as 0.
    profit = revenue (since server_price = 0).
    """
    db = request.app.state.db
    start, end = _date_range(period)
    match = _match_stage(start, end)

    orders_data, payments_data, tickets_data, order_rows, payment_rows = await asyncio.gather(
        _agg_orders(db,          match, group_by),
        _agg_payments(db,        match, group_by),
        _agg_tickets(db,         match, group_by),
        _fetch_order_rows(db,    match, group_by),
        _fetch_payment_rows(db,  match, group_by),
    )

    # Merge all period keys
    all_periods = sorted(
        set(orders_data) | set(payments_data) | set(tickets_data)
    )

    rows = []
    for period_key in all_periods:
        od = orders_data.get(period_key,   {})
        pd = payments_data.get(period_key, {})
        td = tickets_data.get(period_key,  {})

        charges      = round(od.get("charges",      0.0), 4)
        server_price = round(od.get("server_cost",  0.0), 4)
        revenue      = round(charges - server_price,       4)   # our margin
        profit       = revenue                                   # same — kept for API compat

        rows.append({
            "period":          period_key,
            "payments":        pd.get("payments",       0),
            "revenue":         revenue,
            "orders":          od.get("orders",         0),
            "quantity":        od.get("quantity",       0),
            "charges":         charges,
            "profit":          profit,
            "server_price":    server_price,
            "tickets":         td.get("tickets",        0),
            "ticket_replies":  td.get("ticket_replies", 0),
            "refills":         0,
            "refill_quantity": 0,
        })

    # Summary totals
    total_charges      = round(sum(r["charges"]      for r in rows), 4)
    total_server_price = round(sum(r["server_price"] for r in rows), 4)
    total_revenue      = round(total_charges - total_server_price,    4)

    summary = {
        "total_payments":       sum(r["payments"]       for r in rows),
        "total_revenue":        total_revenue,
        "total_orders":         sum(r["orders"]         for r in rows),
        "total_quantity":       sum(r["quantity"]       for r in rows),
        "total_charges":        total_charges,
        "total_profit":         total_revenue,
        "total_server_price":   total_server_price,
        "total_tickets":        sum(r["tickets"]        for r in rows),
        "total_ticket_replies": sum(r["ticket_replies"] for r in rows),
        "total_refills":        0,
    }

    logger.info(
        "Reports fetched — period=%s group_by=%s rows=%d revenue=$%.2f orders=%d",
        period, group_by, len(rows), summary["total_revenue"], summary["total_orders"],
    )
    return {"summary": summary, "rows": rows, "order_rows": order_rows, "payment_rows": payment_rows}
