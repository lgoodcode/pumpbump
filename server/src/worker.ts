declare global {
  interface WorkerGlobalScope extends Window {
    onmessage: (event: MessageEvent) => void;
    postMessage: (message: any) => void;
  }
}

const tasks: any = {};

(self as unknown as WorkerGlobalScope).onmessage = (event) => {
  const { task: { id, action } } = event.data;

  if (action === "start") {
    if (tasks[id]) {
      console.log("Task already running");
    } else {
      tasks[id] = setInterval(() => {
        console.log("Task running");
      }, 1000);
    }
  } else if (action === "stop") {
    if (tasks[id]) {
      clearInterval(tasks[id]);
      delete tasks[id];
      console.log("Task stopped");
    } else {
      console.log("Task not found");
    }
  }
};
