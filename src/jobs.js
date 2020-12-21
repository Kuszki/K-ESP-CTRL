function onTasksLoad(data)
{
	for (const k in data)
	{
		onTasksAppend(k, data[k]);
	}
}

function onTasksAppend(id, data)
{
	var sec = getElem('tasks');

	var form = genElem("form");
	var tab = genElem("table");
	var row = genElem("tr");

	var cols = []; for (i = 0; i < 5; ++i)
	{
		col = genElem("td");
		appCh(row, col);
		cols.push(col);
	}

	var sid = '[' + id + ']';

	var dat = data['when'] * 1000 + off;
	var lab = genLabel(form, '•', null, 'tlab' + sid);
	var dwhen = genItem(form, 'input', 'date', 'dwhen' + sid, true);
	var twhen = genItem(form, 'input', 'time', 'twhen' + sid, true);
	var sact = genItem(form, 'select', null, 'job' + sid, true);
	var bdel = genItem(form, 'input', 'button', 'tdel' + sid);

	for (k in acts)
	{
		var opt = genElem("option");
		opt.innerText = acts[k];
		opt.value = k;
		appCh(sact, opt);
	}

	bdel.onclick = function()
	{
		onTasksRemove(id);
	}

	dwhen.valueAsNumber = new Date(dat);
	dwhen.min = new Date();
	twhen.valueAsNumber = new Date(dat);
	sact.value = data['job'];
	bdel.value = 'Usuń';

	cols[2].innerText = ':';

	appCh(cols[0], lab);
	appCh(cols[1], dwhen);
	appCh(cols[1], twhen);
	appCh(cols[3], sact);
	appCh(cols[4], bdel);

	appCh(tab, row);
	appCh(form, tab);
	appCh(sec, form);

	form.id = 'task_' + id;
}

function onTasksAdd()
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.get('genid.html?task'))
	.done(function(data)
	{
		onExpand('tasks', true);
		onTasksAppend(data, {});
		set_locked = false;
	})
	.fail(function()
	{
		showToast('Nie udało się uzyskać identyfikatora', 5000);
		set_locked = false;
	});
}

function onTasksRemove(id)
{
	getElem('task_' + id).remove();

	var n = ta_add.indexOf(id);

	if (n > -1) ta_add.splice(n, 1);
	else ta_del.push(id);
}

function onTasksSave()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = getElem('tasks').children;
	var req = {}, ch = false, ok = true;

	for (k in ta_del) { req[ta_del[k]] = 'del'; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = sec[i].id.replace('task_', '');
		var sid = '[' + id + ']';
		var org = ta_org[id];

		var ejob = getElem('job' + sid);
		var edate = getElem('dwhen' + sid);
		var etime = getElem('twhen' + sid);

		var job = ejob.value;
		var when =
			(edate.valueAsNumber - off) / 1000 +
			etime.valueAsNumber / 1000;

		ok = ok &&
			ejob.validity.valid &&
			edate.validity.valid &&
			etime.validity.valid;

		if (org == null || org.when != when || org.job != job)
		{
			req[id] = when + ',' + job; ch = true;
		}
	}

	if (ch && ok) showToast('Zapisywanie zmian...', 0);

	if (!ch)
	{
		showToast('Brak zmian do zapisania', 5000);
		set_locked = false;
	}
	else if (!ok)
	{
		showToast('Zadane parametry są niepoprawne', 5000);
		set_locked = false;
	}
	else	$.when($.get('taskup', req))
	.done(function()
	{
		showToast('Zdarzenia zostały zapisane', 5000);
		set_locked = false;
	})
	.fail(function()
	{
		showToast('Nie udało się zapisać zdarzeń', 5000);
		set_locked = false;
	});
}

function onTasksReset()
{
	var sec = getElem('tasks').children;

	while (sec.length) sec[0].remove();

	if (ta_org == null) onLoad();
	else onTasksLoad(ta_org);

	onExpand('tasks', true);
}
