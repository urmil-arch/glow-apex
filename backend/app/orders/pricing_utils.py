"""Shared pricing helpers used across checkout and fulfillment."""

CATEGORY_TO_SERVICE_TYPE: dict[str, str] = {
    "YouTube Views":                "youtube_views",
    "YouTube Likes":                "youtube_likes",
    "YouTube Subscribers":          "youtube_subscribers",
    "YouTube Comments":             "youtube_comments",
    "YouTube Shorts Views":         "youtube_shorts_views",
    "YouTube Shorts Likes":         "youtube_shorts_likes",
    "Country Targeted Subscribers": "country_targeted_subscribers",
}


def calc_service_package_charge(pkg: dict) -> float:
    """
    Compute the portal price for a service_packages document.
    portal_rate is in $/1000; discount is applied on top.
    """
    quantity: int = pkg["quantity"]
    portal_rate: float = pkg.get("portal_rate", 0.0)
    base = (quantity / 1000) * portal_rate
    dtype = pkg.get("discount_type", "none")
    dval = float(pkg.get("discount_value", 0.0))
    if dtype == "fixed":
        return max(0.0, base - dval)
    if dtype == "percentage":
        return max(0.0, base * (1 - dval / 100))
    return base


def calc_pricing_charge(pricing_doc: dict, quantity: int) -> float | None:
    """
    Return the admin-set price for the exact quantity package with discount applied.
    Returns None if no matching active package is found — caller should fall back to
    the SMM service rate.
    """
    price_per_1000: float = pricing_doc.get("price_per_1000", 0.0)
    if price_per_1000 <= 0:
        return None
    for list_key in ("value_packages", "bulk_packages"):
        for pkg in pricing_doc.get(list_key, []):
            if pkg.get("quantity") == quantity and pkg.get("is_active", True):
                base = (quantity / 1000) * price_per_1000
                dtype = pkg.get("discount_type", "none")
                dval  = float(pkg.get("discount_value", 0))
                if dtype == "fixed":
                    return max(0.0, base - dval)
                if dtype == "percentage":
                    return max(0.0, base * (1 - dval / 100))
                return base
    return None
