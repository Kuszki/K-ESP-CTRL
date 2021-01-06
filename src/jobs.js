function onTasksLoad(data)
{
	for (const k in data)
	{
		onTasksAppend(k, data[k]);
	}
}

function onTasksAppend(id, data)
{
	id = Number(id); if (Number.isNaN(id)) return;

	var sec = document.getElementById('tasks');
	var form = document.createElement('form');
	var tab = document.createElement('table');
	var row = document.createElement('tr');

	var cols = []; for (i = 0; i < 5; ++i)
	{
		col = document.createElement('td');
		row.appendChild(col);
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
		var opt = document.createElement('option');
		opt.innerText = acts[k];
		opt.value = k;
		sact.appendChild(opt);
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

	cols[0].appendChild(lab);
	cols[1].appendChild(dwhen);
	cols[1].appendChild(twhen);
	cols[3].appendChild(sact);
	cols[4].appendChild(bdel);

	tab.appendChild(row);
	form.appendChild(tab);
	sec.appendChild(form);

	form.id = 'task_' + id;
}

function onTasksAdd()
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.get('genid.var?task'))
	.done(function(data)
	{
		ta_add.push(Number(data));
		onExpand('tasks', true);
		onTasksAppend(data, {});
		set_locked = false;
	})
	.fail(function()
	{
		onError('id');
	});
}

function onTasksRemove(id)
{
	document.getElementById('task_' + id).remove();

	var n = ta_add.indexOf(id);

	if (n > -1) ta_add.splice(n, 1);
	else ta_del.push(id);
}

function onTasksSave()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = document.getElementById('tasks').children;
	var req = {}, ch = false, ok = true;

	for (k in ta_del) { req[ta_del[k]] = { 'del': true }; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = Number(sec[i].id.replace('task_', ''));

		var sid = '[' + id + ']';
		var org = ta_last[id];

		var ejob = document.getElementById('job' + sid);
		var edate = document.getElementById('dwhen' + sid);
		var etime = document.getElementById('twhen' + sid);

		var job = Number(ejob.value);
		var when = Number(
			(edate.valueAsNumber - off) / 1000 +
			etime.valueAsNumber / 1000);

		ok = ok &&
			ejob.validity.valid &&
			edate.validity.valid &&
			etime.validity.valid;

		const sc =
		{
			'when': when,
			'job': job
		};

		const is_ch = org == null ||
			sc.when != org.when ||
			sc.job != org.job;

		if (is_ch)
		{
			req[id] = sc;
			ch = true;
		}
	}

	if (ch && ok) showToast('Zapisywanie zmian...', 0);

	if (!ch) onError('nc');
	else if (!ok) onError('val');
	else	$.when($.ajax(
	{
		'url': 'taskup',
		'type': 'POST',
		'contentType': 'application/json',
		'data': JSON.stringify(req)
	}))
	.done(function()
	{
		if (msg == "True")
		{
			onTasksUpdate(req);
			onDone('save_tas');
		}
		else
		{
			onError('save_tas');
		}
	})
	.fail(function()
	{
		onError('save_tas');
	});
}

function onTasksReset()
{
	var sec = document.getElementById('tasks').children;

	while (sec.length) sec[0].remove();

	if (ta_org == null) onLoad();
	else onTasksLoad(ta_org);

	onExpand('tasks', true);
}

function onTasksUpdate(data)
{
	for (const k in data)
		ta_last[k] = data[k];
}
