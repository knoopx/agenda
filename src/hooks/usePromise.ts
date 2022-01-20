import { useEffect, useState } from "react";

export function usePromise(promise: Promise<any>) {
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    promise.then(setValue).catch((err) => {
      setError(err);
    });
  }, [promise]);

  return [value, error];
}
