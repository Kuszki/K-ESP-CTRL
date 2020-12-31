var days = {'pn': 'PN', 'wt': 'WT', 'sr': 'ŚR', 'cz': 'CZ', 'pt': 'PT', 'so': 'SO', 'nd': 'ND'};
var acts = {'0': 'Wyłącz + Ręczne', '1': 'Włącz + Ręczne', '2': 'Automatyczne' };
var sets = {'0': 'Wyłącz', '100': 'Włącz' };

var off = 2*Date.UTC(2000, 0, 1) - (new Date(2000, 0, 1)).getTime();
var set_locked = false;

var sh_org = null, ta_org = null;
var sh_del = [], ta_del = [];
var sh_add = [], ta_add = [];

function onLoad()
{
	$.ajaxSetup({ 'timeout': 2500 });

	$.when($.getJSON('plan.json', onSchedsLoad))
	.done(function(data) { sh_org = data; })
	.fail(function()
	{
		showToast('Nie udało się wczytać harmonohramu', 5000);
	});

	$.when($.getJSON('jobs.json', onTasksLoad))
	.done(function(data) { ta_org = data; })
	.fail(function()
	{
		showToast('Nie udało się wczytać zdarzeń', 5000);
	});
}

function appCh(pa, ch)
{
	pa.appendChild(ch);
}

function getElem(id)
{
	return document.getElementById(id);
}

function genItem(f, c, t, n, req = false)
{
	var i = genElem(c);

	i.type = t;
	i.name = n;
	i.id = n;
	i.required = req;

	f.append(i);

	return i;
}

function genLabel(f, t, p = null, n = null)
{
	var i = genElem('label');

	if (p) i.htmlFor = p;
	if (n) i.id = n;

	i.innerText = t;

	f.append(i);

	return i;
}

function genElem(n)
{
	return document.createElement(n);
}

function onExpand(tree, show = false)
{
	var e = getElem(tree);
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
