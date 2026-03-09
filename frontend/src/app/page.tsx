'use client';

import { FormEvent, useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:4000/api";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
};

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  useEffect(() => {
    const savedToken = window.localStorage.getItem("token");
    const savedUser = window.localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        window.localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload: Record<string, string> =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Authentication failed");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      window.localStorage.setItem("token", data.token);
      window.localStorage.setItem("user", JSON.stringify(data.user));
      setPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong");
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasks() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await res.json();
      setTasks(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load tasks");
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    if (!token || !taskTitle.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create task");
      }
      const created: Task = await res.json();
      setTasks((prev) => [...prev, created]);
      setTaskTitle("");
      setTaskDescription("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create task");
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function toggleTaskCompletion(task: Task) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) {
        throw new Error("Failed to update task");
      }
      const updated: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update task");
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function deleteTask(taskId: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete task");
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to delete task");
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  function handleLogout() {
    setUser(null);
    setToken(null);
    setTasks([]);
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
  }

  const isAuth = !!user && !!token;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg border border-zinc-100 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] p-6 md:p-10">
        <div className="flex flex-col gap-6 border-b md:border-b-0 md:border-r border-zinc-100 pr-0 md:pr-8 pb-6 md:pb-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              TaskFlow
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {isAuth
                ? "You are signed in. Manage your tasks on the right."
                : "Sign in or create an account to manage your tasks from anywhere."}
            </p>
          </div>

          {!isAuth && (
            <>
              <div className="inline-flex self-start rounded-full bg-zinc-100 p-1 text-xs font-medium text-zinc-600">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full transition ${
                    mode === "login"
                      ? "bg-white shadow text-zinc-900"
                      : "text-zinc-500"
                  }`}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full transition ${
                    mode === "register"
                      ? "bg-white shadow text-zinc-900"
                      : "text-zinc-500"
                  }`}
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {mode === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400"
                      placeholder="Jane Doe"
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400"
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    name={mode === "login" ? "password" : "new-password"}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Login"
                    : "Create account"}
                </button>
              </form>
            </>
          )}

          {isAuth && (
            <div className="flex flex-col gap-3 rounded-lg bg-zinc-50 border border-zinc-100 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Logout
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Your tasks are private to this account (stored in MongoDB).
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {isAuth ? "Your tasks" : "Tasks preview"}
              </h2>
              <p className="text-xs text-zinc-500">
                {isAuth
                  ? "Create, complete, and remove tasks to stay on top of your work."
                  : "Sign in to create and manage your personal task list."}
              </p>
            </div>
          </div>

          {isAuth ? (
            <>
              <form
                onSubmit={handleCreateTask}
                className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 px-4 py-3"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700">
                    Task title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400"
                    placeholder="e.g. Plan weekly sprint"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700">
                    Description (optional)
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="min-h-15 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 resize-none"
                    placeholder="Quick details or notes..."
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  {error && (
                    <p className="text-xs text-red-500 truncate">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="ml-auto inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
                  >
                    Add task
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-auto rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
                {tasks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    No tasks yet. Start by creating your first one.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-zinc-100">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-start justify-between gap-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task)}
                          className="flex items-start gap-2 text-left group flex-1"
                        >
                          <span
                            className={`mt-0.5 h-4 w-4 shrink-0 rounded border text-[10px] flex items-center justify-center ${
                              task.completed
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-zinc-300 group-hover:border-zinc-500"
                            }`}
                          >
                            {task.completed ? "✓" : ""}
                          </span>
                          <span className="flex flex-col">
                            <span
                              className={`text-sm font-medium ${
                                task.completed
                                  ? "text-zinc-400 line-through"
                                  : "text-zinc-900"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.description && (
                              <span className="text-xs text-zinc-500">
                                {task.description}
                              </span>
                            )}
                            <span className="mt-0.5 text-[10px] text-zinc-400">
                              {new Date(task.createdAt).toLocaleString()}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="mt-0.5 inline-flex h-6 items-center justify-center rounded-md border border-zinc-200 px-2 text-[10px] text-zinc-500 hover:bg-zinc-100"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                  1
                </span>
                <div>
                  <p className="text-xs font-medium text-zinc-900">
                    Capture what matters
                  </p>
                  <p className="text-xs text-zinc-500">
                    Turn your ideas into clear, actionable tasks.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                  2
                </span>
                <div>
                  <p className="text-xs font-medium text-zinc-900">
                    Stay on track
                  </p>
                  <p className="text-xs text-zinc-500">
                    Check items off as you complete them and keep momentum.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                  3
                </span>
                <div>
                  <p className="text-xs font-medium text-zinc-900">
                    Sign in to get started
                  </p>
                  <p className="text-xs text-zinc-500">
                    Your tasks sync to your account (stored in MongoDB).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
