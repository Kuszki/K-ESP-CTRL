const acts = {'0': 'Wyłącz', '1': 'Włącz', '2': 'Auto' };

const errors =
{
	'load': 'Nie udało się wczytać zadań',
	'save': 'Nie udało się zapisać zadań',
	'val': 'Zadane parametry są niepoprawne',
	'id': 'Nie udało się uzyskać identyfikatora',
	'nc': 'Brak zmian do zapisania'
};

const dones =
{
	'save': 'Zadania zostały zapisane'
};

const off = Date.UTC(2000, 0, 1);

var org = null, last = null;
var del = [], add = [];

function onLoad()
{
	$.ajaxSetup({ 'timeout': 5000 });

	$.when($.getJSON('tasks.json', onTasks))
	.done(function(data)
	{
		org = Object.assign({}, data);
		last = Object.assign({}, data);
	})
	.fail(function()
	{
		onError('load');
	});
}

function onTasks(data)
{
	var keys = Object.keys(data).sort(function(a, b)
	{
		if (data[a].when < data[b].when) return -1;
		if (data[a].when > data[b].when) return 1;
		return 0;
	});

	for (const k in keys)
	{
		onAppend(keys[k], data[keys[k]]);
	}
}

function onAppend(id, data)
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
	var dwhen = genItem(form, 'input', 'datetime-local', 'dwhen' + sid, true);
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
		onRemove(id);
	}

	dwhen.valueAsNumber = dat;
	dwhen.min = new Date();
	sact.value = data['job'];
	bdel.value = 'Usuń';

	cols[2].innerText = ':';

	cols[0].appendChild(lab);
	cols[1].appendChild(dwhen);
	cols[3].appendChild(sact);
	cols[4].appendChild(bdel);

	tab.appendChild(row);
	form.appendChild(tab);
	sec.appendChild(form);

	form.id = 'task_' + id;
}

function onAdd()
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.get('genid.var?task'))
	.done(function(data)
	{
		add.push(Number(data));
		onExpand('tasks', true);
		onAppend(data, {});
		set_locked = false;
	})
	.fail(function()
	{
		onError('id');
	});
}

function onRemove(id)
{
	document.getElementById('task_' + id).remove();

	var n = add.indexOf(id);

	if (n > -1) add.splice(n, 1);
	else del.push(id);
}

function onSave()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = document.getElementById('tasks').children;
	var req = {}, ch = false, ok = true;

	for (k in del) { req[del[k]] = { 'del': true }; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = Number(sec[i].id.replace('task_', ''));

		var sid = '[' + id + ']';
		var org = last[id];

		var ejob = document.getElementById('job' + sid);
		var edate = document.getElementById('dwhen' + sid);

		var job = Number(ejob.value);

		var when = Number((edate.valueAsNumber - off) / 1000);

		ok = ok &&
			ejob.validity.valid &&
			edate.validity.valid;

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
	.done(function(msg)
	{
		if (msg == "True")
		{
			onUpdate(req);
			onDone('save');
		}
		else
		{
			onError('save');
		}
	})
	.fail(function()
	{
		onError('save');
	});
}

function onReset()
{
	var sec = document.getElementById('tasks').children;

	while (sec.length) sec[0].remove();

	if (org == null) onLoad();
	else onTasks(org);

	onExpand('tasks', true);
}

function onUpdate(data)
{
	for (const k in data)
		last[k] = data[k];
}
