const days = {'pn': 'PN', 'wt': 'WT', 'sr': 'ŚR', 'cz': 'CZ', 'pt': 'PT', 'so': 'SO', 'nd': 'ND'};
const acts = {'0': 'Wyłącz + Ręczne', '1': 'Włącz + Ręczne', '2': 'Automatyczne' };
const sets = {'0': 'Wyłącz', '100': 'Włącz' };

const errors =
{
	'load_sch': 'Nie udało się wczytać harmonogramu',
	'load_tas': 'Nie udało się wczytać zdarzeń',
	'save_sch': 'Nie udało się zapisać harmonogramu',
	'save_tas': 'Nie udało się zapisać zdarzeń',
	'val': 'Zadane parametry są niepoprawne',
	'id': 'Nie udało się uzyskać identyfikatora',
	'nc': 'Brak zmian do zapisania'
};

const dones =
{
	'save_sch': 'Harmonogram został zapisany',
	'save_tas': 'Zdarzenia został zapisany'
};

const off = 2*Date.UTC(2000, 0, 1) - new Date(2000, 0, 1);

var sh_org = null, ta_org = null;
var sh_last = null, ta_last = null;
var sh_del = [], ta_del = [];
var sh_add = [], ta_add = [];
var set_locked = false;

function onLoad()
{
	$.ajaxSetup({ 'timeout': 2500 });

	$.when($.getJSON('scheds.json', onSchedsLoad))
	.done(function(data)
	{
		sh_org = Object.assign({}, data);
		sh_last = Object.assign({}, data);
	})
	.fail(function()
	{
		onError('load_sch');
	});

	$.when($.getJSON('tasks.json', onTasksLoad))
	.done(function(data)
	{
		ta_org = Object.assign({}, data);
		ta_last = Object.assign({}, data);
	})
	.fail(function()
	{
		onError('load_tas');
	});
}

function onExpand(tree, show = false)
{
	var e = document.getElementById(tree);
	if (e == null) return;

	if (e.className == 'hide')
	{
		e.className = 'off';
		setTimeout(function()
		{
			e.className = 'on';
		}, 150);
	}
	else if (!show)
	{
		e.className = 'off';
		setTimeout(function()
		{
			e.className = 'hide';
		}, 1000);
	}
}

function onError(code)
{
	var msg = 'Wystąpił błąd';

	if (errors.hasOwnProperty(code))
		msg = errors[code];

	showToast(msg, 5000);
	set_locked = false;
}

function onDone(code)
{
	var msg = 'Wykonano zapytanie';

	if (dones.hasOwnProperty(code))
		msg = dones[code];

	showToast(msg, 5000);
	set_locked = false;
}

function genItem(f, c, t, n, req = false)
{
	var i = document.createElement(c);

	i.type = t;
	i.name = n;
	i.id = n;
	i.required = req;

	f.append(i);

	return i;
}

function genLabel(f, t, p = null, n = null)
{
	var i = document.createElement('label');

	if (p) i.htmlFor = p;
	if (n) i.id = n;

	i.innerText = t;
	f.append(i);

	return i;
}

function onSchedsLoad(data)
{
	for (const k in data)
	{
		onSchedsAppend(k, data[k]);
	}
}

function onSchedsAppend(id, data)
{
	id = Number(id); if (Number.isNaN(id)) return;

	var sec = document.getElementById('scheds');
	var form = document.createElement('form');
	var tab = document.createElement('table');
	var row = document.createElement('tr');

	var sid = '[' + id + ']';

	var cols = []; for (i = 0; i < 9; ++i)
	{
		col = document.createElement('td');
		row.appendChild(col);
		cols.push(col);
	}

	var i = 0; for (k in days)
	{
		var cd = genItem(form, 'input', 'checkbox', k + sid);
		var ld = genLabel(form, days[k], k + sid);

		cd.checked = data['days'] & (1 << i++);
		cols[1].appendChild(cd);
		cols[1].appendChild(ld);
	}

	var lab = genLabel(form, '•', null, 'slab' + sid);
	var tfrom = genItem(form, 'input', 'time', 'from' + sid, true);
	var tto = genItem(form, 'input', 'time', 'to' + sid, true);
	var sact = genItem(form, 'select', null, 'act' + sid, true);
	var bdel = genItem(form, 'input', 'button', 'sdel' + sid);

	for (k in sets)
	{
		var opt = document.createElement('option');
		opt.innerText = sets[k];
		opt.value = k;
		sact.appendChild(opt);
	}

	for (t = 15.0; t <= 25.0; t += 0.25)
	{
		var opt = document.createElement('option');
		opt.innerText = t + ' ℃';
		opt.value = t;
		sact.appendChild(opt);
	}

	lab.onclick = function()
	{
		var on = lab.innerText == '✓';
		lab.innerText = !on ? '✓' : '✗';
	}

	bdel.onclick = function()
	{
		onSchedsRemove(id);
	}

	lab.innerText = data['on'] ? '✓' : '✗';
	tfrom.valueAsNumber = data['from'] * 60000;
	tto.valueAsNumber = data['to'] * 60000;
	sact.value = data['act'];
	bdel.value = 'Usuń';

	cols[2].innerText = ',';
	cols[4].innerText = '-';
	cols[6].innerText = ':';

	cols[0].appendChild(lab);
	cols[3].appendChild(tfrom);
	cols[5].appendChild(tto);
	cols[7].appendChild(sact);
	cols[8].appendChild(bdel);

	tab.appendChild(row);
	form.appendChild(tab);
	sec.appendChild(form);

	form.id = 'sched_' + id;
}

function onSchedsAdd()
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.get('genid.var?sched'))
	.done(function(data)
	{
		sh_add.push(Number(data));
		onExpand('scheds', true);
		onSchedsAppend(data, {});
		set_locked = false;
	})
	.fail(function()
	{
		onError('id');
	});
}

function onSchedsRemove(id)
{
	document.getElementById('sched_' + id).remove();

	const n = sh_add.indexOf(id);

	if (n > -1) sh_add.splice(n, 1);
	else sh_del.push(id);
}

function onSchedsSave()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = document.getElementById('scheds').children;
	var req = {}, ch = false, ok = true;

	for (k in sh_del) { req[sh_del[k]] = { 'del': true }; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = sec[i].id.replace('sched_', '');
		var sid = '[' + id + ']';
		var org = sh_last[id];

		var mask = 0, j = 0; for (k in days)
		{
			var che = document.getElementById(k + sid);
			mask = mask | (che.checked << j++);
		}

		var eon = document.getElementById('slab' + sid);
		var efrom = document.getElementById('from' + sid);
		var eto = document.getElementById('to' + sid);
		var eact = document.getElementById('act' + sid);

		var on = eon.innerText == '✓' ? 1 : 0;
		var from = Number(efrom.valueAsNumber / 60000);
		var to = Number(eto.valueAsNumber / 60000);
		var act = Number(eact.value);

		ok = ok && (from != to) &&
			efrom.validity.valid &&
			eto.validity.valid &&
			eact.validity.valid;

		const sc =
		{
			'on': on,
			'days': mask,
			'act': act,
			'from': from,
			'to': to
		};

		const is_ch = org == null ||
			sc.on != org.on ||
			sc.days != org.days ||
			sc.act != org.act ||
			sc.from != org.from ||
			sc.to != org.to;

		if (is_ch)
		{
			req[id] = sc;
			ch = true;
		}
	}

	if (ch && ok) showToast('Zapisywanie zmian...', 0);

	if (!ch) onError('nc');
	else if (!ok) onError('val');
	else $.when($.ajax(
	{
		'url': 'schedup',
		'type': 'POST',
		'contentType': 'application/json',
		'data': JSON.stringify(req)
	}))
	.done(function(msg)
	{
		if (msg == "True")
		{
			onSchedsUpdate(req);
			onDone('save_sch');
		}
		else
		{
			onError('save_sch');
		}
	})
	.fail(function()
	{
		onError('save_sch');
	});
}

function onSchedsReset()
{
	var sec = document.getElementById('scheds').children;

	while (sec.length) sec[0].remove();

	if (sh_org == null) onLoad();
	else onSchedsLoad(sh_org);

	onExpand('scheds', true);
}

function onSchedsUpdate(data)
{
	for (const k in data)
		sh_last[k] = data[k];
}

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
