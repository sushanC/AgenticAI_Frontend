import {
  useState,
  useEffect
} from "react";

import axios from "axios";

export default function TasksPanel() {

  const [tasks, setTasks] =
    useState([]);

  const [text, setText] =
    useState("");

  async function loadTasks() {

    const response =
      await axios.get(
        "http://localhost:3001/tasks"
      );

    setTasks(
      response.data
    );
  }

  async function addTask() {

    if (!text.trim())
      return;

    await axios.post(
      "http://localhost:3001/tasks",
      {
        text
      }
    );

    setText("");

    loadTasks();
  }

  async function toggleTask(
    id
  ) {

    await axios.put(
      `http://localhost:3001/tasks/${id}`
    );

    loadTasks();
  }

  useEffect(() => {

    loadTasks();

  }, []);

  return (

    <div
      style={{
        padding: "20px"
      }}
    >

      <h2>
        Tasks
      </h2>

      <input
        value={text}
        onChange={e =>
          setText(
            e.target.value
          )
        }
        placeholder="New task..."
      />

      <button
        onClick={addTask}
      >
        Add
      </button>

      <hr />

      {tasks.map(task => (

        <div
          key={task.id}
          style={{
            marginBottom:
              "10px"
          }}
        >

          <input
            type="checkbox"
            checked={
              task.completed
            }
            onChange={() =>
              toggleTask(
                task.id
              )
            }
          />

          {" "}

          <span
            style={{
              textDecoration:
                task.completed
                  ? "line-through"
                  : "none"
            }}
          >
            {task.text}
          </span>

        </div>

      ))}

    </div>
  );
}