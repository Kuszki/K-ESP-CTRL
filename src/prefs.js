var set_locked = false;
var cf_org = null;

function onLoad()
{
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
	var f = document.getElementById('prefs').elements;
	var ok = true;

	for (i = 0; i < f.length; ++i)
	{
		ok = ok && f[i].validity.valid;
	}

	if (!ok)
	{
		showToast('Zadane parametry są niepoprawne', 5000); return;
	}

	if (set_locked) return;
	else set_locked = true;

	showToast("Łączenie z urządzeniem...", 0);

	var data = $('#prefs').serialize() + '&save=1';

	$.when($.get('config', data))
	.done(function()
	{
		showToast('Ustawienia zostały zapisane', 5000);
	})
	.fail(function()
	{
		showToast('Nie udało się zapisać ustawień', 5000);
	});

	set_locked = false;
}

function onDefault(data)
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.getJSON('default.json', onPrefs))
	.fail(function()
	{
		showToast('Nie udało się wczytać wartości', 5000);
	});

	set_locked = false;
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
