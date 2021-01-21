const errors =
{
	'load': 'Nie udało się wczytać ustawień',
	'save': 'Nie udało się zapisać ustawień',
	'boot': 'Nie udało się zrestartować urządzenia'
	'val': 'Zadane parametry są niepoprawne',
	'nc': 'Brak zmian do zapisania'
};

const dones =
{
	'save': 'Ustawienia zostały zapisane',
	'boot': 'Urządzenie zostało zrestartowane'
};

var cf_org, cf_last = null;

function onLoad()
{
	$.ajaxSetup({ 'timeout': 5000 });

	$.when($.getJSON('prefs.json', onPrefs))
	.done(function(data)
	{
		cf_org = Object.assign({}, data);
		cf_last = Object.assign({}, data);
	})
	.fail(function()
	{
		onError('load');
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
		if (cf_last[f[i].id] != f[i].value)
		{
			ok = ok && f[i].validity.valid;
			data[f[i].id] = f[i].value;
			ch = true;
		}
	}

	if (ch && ok) showToast('Zapisywanie ustawień...', 0);

	if (!ok) onError('val');
	else if (!ch) onError('nc');
	else $.when($.ajax(
	{
		'url': 'config',
		'type': 'POST',
		'contentType': 'application/json',
		'data': JSON.stringify(data)
	}))
	.done(function(msg)
	{
		if (msg == 'True')
		{
			onUpdate(data);
			onDone('save');
		}
		else
		{
			onError('save');
		}
	})
	.fail(function()
	{
		onError('save');
	});
}

function onDefault(data)
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.getJSON('default.json'))
	.done(function(data)
	{
		onPrefs(data);
		set_locked = false;
	})
	.fail(function()
	{
		onError('load');
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

function onUpdate(data)
{
	for (const k in data)
		cf_last[k] = data[k];
}

function onReboot()
{
	if (set_locked) return;
	else set_locked = true;

	showToast('Łączenie z urządzeniem...', 0);

	$.when($.get('config', { reboot: true }))
	.done(function()
	{
		$.getJSON('system.json', onSystem);
		onDone('boot');
	})
	.fail(function()
	{
		onError('boot');
	});
}
