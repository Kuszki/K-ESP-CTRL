function onTasksLoad(data)
{
	for (const k in data)
	{
		onTasksAppend(k, data[k]);
	}
}

function onTasksAdd()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = getElem('tasks').children;

	$.when($.get('genid.html?task'))
	.done(function(data)
	{
		onTasksAppend(data, {});
	})
	.fail(function()
	{
		showToast('Nie udało się uzyskać identyfikatora', 5000);
	});

	set_locked = false;
}

function onTasksRemove(id)
{
	getElem('task_' + id).remove();
	ta_del.push(id);

	var sec = getElem('tasks').children;
}

function onTasksSave()
{
	if (set_locked) return;
	else set_locked = true;

	showToast('Zapisywanie zmian...', 0);

	var sec = getElem('tasks').children;
	var req = {}, ch = false;

	for (k in ta_del) { req[ta_del[k]] = 'del'; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = sec[i].id.replace('task_', '');
		var sid = '[' + id + ']';
		var org = ta_org[id];

		var when = (getElem('dwhen' + sid).valueAsNumber - off) / 1000;
		when += getElem('twhen' + sid).valueAsNumber / 1000;
		var job = getElem('job' + sid).value;

		if (org == null || org.when != when || org.job != job)
		{
			req[id] = when + ',' + job; ch = true;
		}
	}

	if (!ch) showToast('Brak zmian do zapisania', 5000);
	else	$.when($.get('taskup', req))
	.done(function()
	{
		showToast('Zdarzenia zostały zapisane', 5000);
	})
	.fail(function()
	{
		showToast('Nie udało się zapisać zdarzeń', 5000);
	});

	set_locked = false;
}

function onTasksReset()
{
	var sec = getElem('tasks').children;

	while (sec.length) sec[0].remove();

	if (ta_org == null) onLoad();
	else onTasksLoad(ta_org);
}
