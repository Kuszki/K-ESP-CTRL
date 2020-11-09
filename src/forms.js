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

	dwhen.onchange = function()
	{
		// TODO
	}

	dwhen.valueAsNumber = new Date(dat);
	dwhen.min = new Date();
	twhen.valueAsNumber = new Date(dat);
	twhen.minimum = new Date();
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
