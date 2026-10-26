<script lang="ts">
  import { onMount } from 'svelte';
  import { createTask, initialTasks } from '../../../shared/task-model';
  import '../../../shared/styles.css';
  let tasks = $state(initialTasks.map(task => ({ ...task })));
  let title = $state('');
  let error = $state('');
  let notice = $state('');
  const completed = $derived(tasks.filter(task => task.completed).length);
  onMount(() => {
    document.documentElement.dataset.tevraReady = 'true';
    return () => { delete document.documentElement.dataset.tevraReady; };
  });
  function addTask(event: SubmitEvent) {
    event.preventDefault();
    const result = createTask(title, crypto.randomUUID());
    if (!result.ok) { error = result.error; notice = ''; return; }
    tasks = [...tasks, result.task]; title = ''; error = ''; notice = `Added ${result.task.title}.`;
  }
</script>

<svelte:head><title>Tevra Studio — SvelteKit tasks</title><meta name="description" content="A functional local SvelteKit task workspace for Tevra validation." /></svelte:head>
<a class="skip-link" href="#main">Skip to tasks</a>
<header class="site-header"><a class="brand" href="#main">tevra<span>studio</span></a><span class="workspace-label">Design operations</span></header>
<main id="main" class="workspace">
  <section class="intro" aria-labelledby="page-title"><p class="eyebrow">Your workspace</p><h1 id="page-title">Make room for good work.</h1><p>One clear place for the details that move a project forward.</p></section>
  <div class="workspace-grid">
    <section class="task-panel" aria-labelledby="tasks-title"><div class="section-heading"><h2 id="tasks-title">Project tasks</h2><span>{completed} of {tasks.length} complete</span></div>
      <form onsubmit={addTask} novalidate><label for="task-title">Add a task</label><div class="form-row"><input id="task-title" bind:value={title} oninput={() => error = ''} aria-invalid={Boolean(error)} aria-describedby={error ? 'task-error' : 'task-help'} maxlength={120} /><button class="primary-button" type="submit" disabled={!title.trim()}>Add task</button></div><p id="task-help" class="help">Tasks stay in this tab and reset when you reload.</p>{#if error}<p id="task-error" class="error" role="alert">{error}</p>{/if}</form>
      <p class="status" role="status">{notice}</p>
      {#if tasks.length}<ul class="task-list">{#each tasks as task (task.id)}<li><label class="task-label"><input type="checkbox" bind:checked={task.completed} /><span class:task-completed={task.completed}>{task.title}</span></label><button class="text-button" type="button" aria-label={`Remove ${task.title}`} onclick={() => { tasks = tasks.filter(candidate => candidate.id !== task.id); notice = `Removed ${task.title}.`; }}>Remove</button></li>{/each}</ul>{:else}<p class="empty">A clear slate. Add your first task above.</p>{/if}
    </section>
    <aside class="project-note" aria-labelledby="note-title"><p class="eyebrow">Working agreement</p><h2 id="note-title">Progress with intention.</h2><p>Keep tasks small, decisions visible, and the next action clear.</p><dl><div><dt>Open tasks</dt><dd>{tasks.length - completed}</dd></div><div><dt>Completed</dt><dd>{completed}</dd></div></dl><p class="help">This example performs real local task actions. It has no network integration.</p></aside>
  </div>
</main>
<footer>Tevra Design Kit · Functional interface example</footer>
