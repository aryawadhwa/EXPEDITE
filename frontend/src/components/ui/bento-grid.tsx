import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-6 bg-black/40 border border-white/10 backdrop-blur-sm justify-between flex flex-col space-y-4 hover:border-purple-500/30",
        className
      )}
    >
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div className="mb-4 text-purple-400 bg-purple-500/10 w-fit p-3 rounded-2xl border border-purple-500/20">
            {icon}
        </div>
        <div className="font-sans font-bold text-white text-xl mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-purple-200/60 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
