function onSchedsAppend(id, data)
{
	var sec = getElem('scheds');

	var form = genElem("form");
	var tab = genElem("table");
	var row = genElem("tr");

	var sid = '[' + id + ']';

	var cols = []; for (i = 0; i < 6; ++i)
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

	var lab = genLabel(form, '•');
	var tfrom = genItem(form, 'input', 'time', 'from' + sid, true);
	var lfrom =  genLabel(form, 'Od', 'from' + sid);
	var tto = genItem(form, 'input', 'time', 'to' + sid, true);
	var lto = genLabel(form, 'Do', 'to' + sid);
	var sact = genItem(form, 'select', null, 'act' + sid);
	var lact = genLabel(form, 'Sterowanie', 'act' + sid, true);
	var bdel = genItem(form, 'input', 'button', 'del' + sid);

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

	bdel.onclick = function()
	{
		onSchedsRemove(id);
	}

	tfrom.valueAsNumber = data['from'] * 60000;
	tto.valueAsNumber = data['to'] * 60000;
	sact.value = data['act'];
	tto.min = tfrom.value;
	tfrom.max = tto.value;
	bdel.value = 'Usuń';

	appCh(cols[0], lab);
	appCh(cols[2], lfrom); appCh(cols[2], tfrom);
	appCh(cols[3], lto); appCh(cols[3], tto);
	appCh(cols[4], lact); appCh(cols[4], sact);
	appCh(cols[5], bdel);

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

	var cols = []; for (i = 0; i < 4; ++i)
	{
		col = genElem("td");
		appCh(row, col);
		cols.push(col);
	}

	var sid = '[' + id + ']';

	var lab = genLabel(form, '•');
	var dwhen = genItem(form, 'input', 'date', 'dwhen' + sid, true);
	var twhen =  genItem(form, 'input', 'time', 'twhen' + sid, true);
	var sact = genItem(form, 'select', null, 'job' + sid);
	var bdel = genItem(form, 'input', 'button', 'del' + sid);

	for (k in acts)
	{
		var opt = genElem("option");
		opt.innerText = sets[k];
		opt.value = k;
		appCh(sact, opt);
	}

	bdel.onclick = function()
	{
		onPlansRemove(id);
	}

	dwhen.valueAsNumber = data['when'] * 1000 + off;
	dwhen.minimum = new Date();
	twhen.valueAsNumber = data['when'] * 1000 + off;
	sact.value = data['job'];
	bdel.value = 'Usuń';

	appCh(cols[0], lab);
	appCh(cols[1], dwhen);
	appCh(cols[1], twhen);
	appCh(cols[2], sact);
	appCh(cols[3], bdel);

	appCh(tab, row);
	appCh(form, tab);
	appCh(sec, form);

	form.id = 'task_' + id;
}
