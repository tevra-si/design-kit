'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createTask, initialTasks } from '../../shared/task-model';

export function TaskWorkspace() {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const completed = tasks.filter(task => task.completed).length;
  useEffect(() => {
    document.documentElement.dataset.tevraReady = 'true';
    return () => { delete document.documentElement.dataset.tevraReady; };
  }, []);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createTask(title, crypto.randomUUID());
    if (!result.ok) { setError(result.error); setNotice(''); return; }
    setTasks(current => [...current, result.task]); setTitle(''); setError(''); setNotice(`Added ${result.task.title}.`);
  }

  return <>
    <a className="skip-link" href="#main">Skip to tasks</a>
    <header className="site-header"><a className="brand" href="#main">tevra<span>studio</span></a><span className="workspace-label">Design operations</span></header>
    <main id="main" className="workspace">
      <section className="intro" aria-labelledby="page-title"><p className="eyebrow">Your workspace</p><h1 id="page-title">Make room for good work.</h1><p>One clear place for the details that move a project forward.</p></section>
      <div className="workspace-grid">
        <section className="task-panel" aria-labelledby="tasks-title"><div className="section-heading"><h2 id="tasks-title">Project tasks</h2><span>{completed} of {tasks.length} complete</span></div>
          <form onSubmit={addTask} noValidate><label htmlFor="task-title">Add a task</label><div className="form-row"><input id="task-title" value={title} onChange={event => { setTitle(event.target.value); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'task-error' : 'task-help'} maxLength={120} /><button className="primary-button" type="submit" disabled={!title.trim()}>Add task</button></div><p id="task-help" className="help">Tasks stay in this tab and reset when you reload.</p>{error && <p id="task-error" className="error" role="alert">{error}</p>}</form>
          <p className="status" role="status">{notice}</p>
          {tasks.length ? <ul className="task-list">{tasks.map(task => <li key={task.id}><label className="task-label"><input type="checkbox" checked={task.completed} onChange={() => setTasks(current => current.map(candidate => candidate.id === task.id ? { ...candidate, completed: !candidate.completed } : candidate))} /><span className={task.completed ? 'task-completed' : ''}>{task.title}</span></label><button className="text-button" type="button" aria-label={`Remove ${task.title}`} onClick={() => { setTasks(current => current.filter(candidate => candidate.id !== task.id)); setNotice(`Removed ${task.title}.`); }}>Remove</button></li>)}</ul> : <p className="empty">A clear slate. Add your first task above.</p>}
        </section>
        <aside className="project-note" aria-labelledby="note-title"><p className="eyebrow">Working agreement</p><h2 id="note-title">Progress with intention.</h2><p>Keep tasks small, decisions visible, and the next action clear.</p><dl><div><dt>Open tasks</dt><dd>{tasks.length - completed}</dd></div><div><dt>Completed</dt><dd>{completed}</dd></div></dl><p className="help">This example performs real local task actions. It has no network integration.</p></aside>
      </div>
    </main>
    <footer>Tevra Design Kit · Functional interface example</footer>
  </>;
}
