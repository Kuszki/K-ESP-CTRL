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
