function onSchedsLoad(data)
{
	for (const k in data)
	{
		onSchedsAppend(k, data[k]);
	}
}

function onSchedsAppend(id, data)
{
	var sec = getElem('scheds');

	var form = genElem("form");
	var tab = genElem("table");
	var row = genElem("tr");

	var sid = '[' + id + ']';

	var cols = []; for (i = 0; i < 9; ++i)
	{
		col = genElem("td");
		appCh(row, col);
		cols.push(col);
	}

	var i = 0; for (k in days)
	{
		var cd = genItem(form, 'input', 'checkbox', k + sid);
		cd.checked = data['days'] & (1 << i++);

		var ld = genLabel(form, days[k], k + sid);
		appCh(cols[1], cd);	appCh(cols[1], ld);
	}

	var lab = genLabel(form, '•', null, 'slab' + sid);
	var tfrom = genItem(form, 'input', 'time', 'from' + sid, true);
	var tto = genItem(form, 'input', 'time', 'to' + sid, true);
	var sact = genItem(form, 'select', null, 'act' + sid, true);
	var bdel = genItem(form, 'input', 'button', 'sdel' + sid);

	for (k in sets)
	{
		var opt = genElem("option");
		opt.innerText = sets[k];
		opt.value = k;
		appCh(sact, opt);
	}

	for (t = 15.0; t <= 25.0; t += 0.5)
	{
		var opt = genElem("option");
		opt.innerText = t + ' ℃';
		opt.value = t;
		appCh(sact, opt);
	}

	tfrom.onchange = function()
	{
		tto.min = tfrom.value;
	}

	tto.onchange = function()
	{
		tfrom.max = tto.value;
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
	tto.min = tfrom.value;
	tfrom.max = tto.value;
	bdel.value = 'Usuń';

	cols[2].innerText = ',';
	cols[4].innerText = '-';
	cols[6].innerText = ':';

	appCh(cols[0], lab);
	appCh(cols[3], tfrom);
	appCh(cols[5], tto);
	appCh(cols[7], sact);
	appCh(cols[8], bdel);

	appCh(tab, row);
	appCh(form, tab);
	appCh(sec, form);

	form.id = 'sched_' + id;
}

function onSchedsAdd()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = getElem('scheds').children;

	$.when($.get('genid.html?sched'))
	.done(function(data)
	{
		onSchedsAppend(data, {});
	})
	.fail(function()
	{
		showToast('Nie udało się uzyskać identyfikatora', 5000);
	});

	set_locked = false;
}

function onSchedsRemove(id)
{
	getElem('sched_' + id).remove();
	sh_del.push(id);

	var sec = getElem('scheds').children;
}

function onSchedsSave()
{
	if (set_locked) return;
	else set_locked = true;

	var sec = getElem('scheds').children;
	var req = {}, ch = false, ok = true;

	for (k in sh_del) { req[sh_del[k]] = 'del'; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = sec[i].id.replace('sched_', '');
		var sid = '[' + id + ']';
		var org = sh_org[id];

		var on = getElem('slab' + sid).innerText == '✓' ? 1 : 0;

		var mask = 0, j = 0; for (k in days)
		{
			var che = getElem(k + sid);
			mask = mask | (che.checked << j++);
		}

		var efrom = getElem('from' + sid);
		var eto = getElem('to' + sid);
		var eact = getElem('act' + sid);

		var from = efrom.valueAsNumber / 60000;
		var to = eto.valueAsNumber / 60000;
		var act = eact.value;

		ok = ok &&
			efrom.validity.valid &&
			eto.validity.valid &&
			eact.validity.valid;

		if (org == null || org.days != mask || org.from != from || org.to != to || org.act != act || org.on != on)
		{
			req[id] = mask + ',' + from + ',' + to + ',' + act + ',' + on; ch = true;
		}
	}

	if (ch && ok) showToast('Zapisywanie zmian...', 0);

	if (!ch) showToast('Brak zmian do zapisania', 5000);
	else if (!ok) showToast('Zadane parametry są niepoprawne', 5000);
	else $.when($.get('schedup', req))
	.done(function()
	{
		showToast('Harmonogram został zapisany', 5000);
	})
	.fail(function()
	{
		showToast('Nie udało się zapisać harmonogramu', 5000);
	});

	set_locked = false;
}

function onSchedsReset()
{
	var sec = getElem('scheds').children;

	while (sec.length) sec[0].remove();

	if (sh_org == null) onLoad();
	else onSchedsLoad(sh_org);
}