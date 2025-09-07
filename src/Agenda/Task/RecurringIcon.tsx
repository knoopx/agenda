import IconMdiUpdate from "~icons/mdi/update.jsx";

export const RecurringIcon = (
  props: React.HTMLAttributes<HTMLSpanElement>,
): React.ReactElement => {
  return (
    <span className="flex items-center" {...props}>
      <IconMdiUpdate />
    </span>
  );
};
