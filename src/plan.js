function onSchedsLoad(data)
{
	for (const k in data)
	{
		onSchedsAppend(k, data[k]);
	}
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

	showToast('Zapisywanie zmian...', 0);

	var sec = getElem('scheds').children;
	var req = {}, ch = false;

	for (k in sh_del) { req[sh_del[k]] = 'del'; ch = true; }
	for (i = 0; i < sec.length; ++i)
	{
		var id = sec[i].id.replace('sched_', '');
		var sid = '[' + id + ']';
		var org = sh_org[id];

		var mask = 0, j = 0; for (k in days)
		{
			var che = getElem(k + sid);
			mask = mask | (che.checked << j++);
		}

		var from = getElem('from' + sid).valueAsNumber / 60000;
		var to = getElem('to' + sid).valueAsNumber / 60000;
		var act = getElem('act' + sid).value;
		var on = getElem('slab' + sid).innerText == '✓' ? 1 : 0;

		if (org == null || org.days != mask || org.from != from || org.to != to || org.act != act || org.on != on)
		{
			req[id] = mask + ',' + from + ',' + to + ',' + act + ',' + on; ch = true;
		}
	}

	if (!ch) showToast('Brak zmian do zapisania', 5000);
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
