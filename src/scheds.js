var days = {'pn': 'PN', 'wt': 'WT', 'sr': 'ŚR', 'cz': 'CZ', 'pt': 'PT', 'so': 'SO', 'nd': 'ND'};
var sets = {'0': 'Wyłącz', '100': 'Włącz' };

var set_locked = false;
var cf_org = null;

function onLoad()
{
	$.when($.getJSON('plan.json', onScheds))
	.done(function(data) { cf_org = data; })
	.fail(function()
	{
		showToast('Nie udało się wczytać ustawień', 5000);
	});
}

function onReset()
{
	if (cf_org == null) onLoad();
	else onScheds(cf_org);
}

function onScheds(data)
{
	var i = 0; for (const k in data)
	{
		onAppend(k, data[k], ++i);
	}
}

function onAppend(id, data, no)
{
	var sec = document.getElementById('scheds');

	var form = document.createElement("form");
	var tab = document.createElement("table");
	var row = document.createElement("tr");

	var sid = '[' + id + ']';

	var cols = []; for (i = 0; i < 5; ++i)
	{
		col = document.createElement("td");
		row.appendChild(col); cols.push(col);
	}

	var i = 0; for (k in days)
	{
		var cd = genItem(form, 'input', 'checkbox', k + sid);
		cd.checked = data['days'] & (1 << i++);


		var ld = genLabel(form, days[k], k + sid);

		cols[1].appendChild(cd);
		cols[1].appendChild(ld);
	}

	var lab = genLabel(form, no + ')');
	var tfrom = genItem(form, 'input', 'time', 'from' + sid, true);
	var lfrom =  genLabel(form, 'Od', 'from' + sid);
	var tto = genItem(form, 'input', 'time', 'to' + sid, true);
	var lto = genLabel(form, 'Do', 'to' + sid);
	var sact = genItem(form, 'select', null, 'act' + sid);
	var lact = genLabel(form, 'Sterowanie', 'act' + sid);

	for (k in sets)
	{
		var opt = document.createElement("option");
		opt.innerText = sets[k];
		opt.value = k;

		sact.appendChild(opt);
	}

	for (t = 15.0; t <= 25.0; t += 0.5)
	{
		var opt = document.createElement("option");
		opt.innerText = t + ' ℃';
		opt.value = t;

		sact.appendChild(opt);
	}

	tfrom.onchange = function()
	{
		tto.min = tfrom.value;
	}

	tto.onchange = function()
	{
		tfrom.max = tto.value;
	}

	tfrom.valueAsNumber = data['from'] * 60000;
	tto.valueAsNumber = data['to'] * 60000;
	sact.value = data['set'];
	tto.min = tfrom.value;
	tfrom.max = tto.value;

	cols[0].appendChild(lab);
	cols[2].appendChild(lfrom);
	cols[2].appendChild(tfrom);
	cols[3].appendChild(lto);
	cols[3].appendChild(tto);
	cols[4].appendChild(lact);
	cols[4].appendChild(sact);

	tab.appendChild(row);
	form.appendChild(tab);
	sec.appendChild(form);

	form.id = 'form' + sid;
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

function genLabel(f, t, p = null)
{
	var i = document.createElement("label");

	i.innerText = t;
	i.htmlFor = p;

	f.append(i);

	return i;
}
