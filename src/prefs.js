var set_locked = false;
var cf_org = null;

function onLoad()
{
	$.ajaxSetup({ 'timeout': 2500 });

	$.when($.getJSON('prefs.json', onPrefs))
	.done(function(data) { cf_org = data; })
	.fail(function()
	{
		showToast('Nie udało się wczytać ustawień', 5000);
	});
}

function onReset()
{
	if (cf_org == null) onLoad();
	else onPrefs(cf_org);
}

function onSave()
{
	if (set_locked) return;
	else set_locked = true;

	var f = document.getElementById('prefs').elements;
	var ok = true, ch = false, data = { 'save': 1 };

	for (i = 0; i < f.length; ++i)
	{
		if (cf_org[f[i].id] != f[i].value)
		{
			ok = ok && f[i].validity.valid;
			data[f[i].id] = f[i].value;
			ch = true;
		}
	}

	if (ch && ok) showToast('Zapisywanie ustawień...', 0);

	if (!ok)
	{
		showToast('Zadane parametry są niepoprawne', 5000);
		set_locked = false;
	}
	else if (!ch)
	{
		showToast('Brak zmian do zapisania', 5000);
		set_locked = false;
	}
	else $.when($.ajax(
	{
		'url': 'config',
		'type': 'POST',
		'contentType': 'application/json',
		'data': JSON.stringify(data)
	}))
	.done(function()
	{
		showToast('Ustawienia zostały zapisane', 5000);
		set_locked = false;
	})
	.fail(function()
	{
		showToast('Nie udało się zapisać ustawień', 5000);
		set_locked = false;
	});
}

function onDefault(data)
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.getJSON('default.json', onPrefs))
	.done(function()
	{
		set_locked = false;
	})
	.fail(function()
	{
		showToast('Nie udało się wczytać wartości', 5000);
		set_locked = false;
	});
}

function onPrefs(data)
{
	for (const k in data)
	{
		var e = document.getElementById(k);

		if (e == null) continue;
		else e.value = data[k];
	}
}

function onExpand(tree)
{
	var e = document.getElementById(tree);
	if (e != null) if (e.className == 'hide')
	{
		e.className = 'off';
		setTimeout(function()
		{
			e.className = 'on';
		}, 150);
	}
	else
	{
		e.className = 'off';
		setTimeout(function()
		{
			e.className = 'hide';
		}, 1000);
	}
}
