type ServiceCardProps = {
  title: string;
  description: string[];
  features: string[];
  btnLabel: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

const ServiceCard = ({
  title,
  description,
  features,
  btnLabel,
  icon: Icon,
}: ServiceCardProps) => {
  return (
    <div
      className="flex flex-col justify-between lg:p-8 p-6 border border-[rgba(256,255,254,0.5)] 
    dark:border-[rgba(120,119,198,0.5)] dark:bg-white/5 bg-[#1e072410] backdrop-blur-2xl rounded-xl"
    >
      <div className="flex flex-col justify-start">
        <Icon size={32}/>
        <h4 className="text-2xl mt-4 font-medium">{title}</h4>
        {description.map((desc, index) => (
          <p
            key={index}
            className={`text-sm dark:text-white/80 text-black/80 ${
              index === 0 ? "mt-4" : "mt-2"
            }`}
          >
            {desc}
          </p>
        ))}
        <ul className="list-disc text-sm mt-4 ml-4 space-y-1.5 text-muted-foreground ">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      <button
        style={{
          background:
            " linear-gradient(20deg, #FFDD55 0, #FF543E 50%, #C837AB 100%)",
        }}
        className="py-3 px-4 w-fit mt-6 rounded-lg text-sm font-medium text-white"
      >
        {btnLabel}
      </button>
    </div>
  );
};


export default ServiceCard;