import classNames from "classnames"
import { MdUpdate } from "react-icons/md"

import { TimeLabel, DurationLabel, DateLabel } from "../Agenda/Label"

export function Output({ input }) {
  return (
    <div className="flex space-x-2 text-xs">
      {input.nextAt && <TimeLabel date={input.nextAt} />}
      {input.duration && <DurationLabel time={input.duration} />}

      <span className="flex flex-auto space-x-2">
        <span
          className={classNames({
            "text-gray-500": !input.subject,
            "font-bold": input.subject,
          })}
        >
          {input.subject || "Enter a task..."}
        </span>
        {input.isRecurring && (
          <span className="flex items-center">
            <MdUpdate />
            &nbsp;
            {input.freq}
          </span>
        )}
      </span>

      {input.nextAt && <DateLabel date={input.nextAt} />}
    </div>
  )
}
