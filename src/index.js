var pl_colors = ['firebrick', 'olive', 'teal', 'seagreen', 'coral', 'crimson', 'limegreen', 'peru'];
var set_locked = false;

function onLoad()
{
	$.ajaxSetup({ 'timeout': 2500 });

	$.when
	(
		$.getJSON('plot.json'),
		$.getJSON('history.json')
	)
	.done(function(config, hist)
	{
		var off = Date.UTC(2000, 0, 1);
		var data = new Array();

		ctx = $('#plot')[0].getContext('2d');
		plot = new Chart(ctx, config[0]);
		moment.locale('pl');

		for (k in hist[0]) $.getJSON(hist[0][k], function(x)
		{
			cn = plot.data.datasets.length;

			x.fill = false;
			x.borderColor = pl_colors[cn];
			x.cubicInterpolationMode = 'monotone'

			for (j = 0; j < x.data.length; ++j)
			{
				var old = x.data[j]['t'] * 1000;
				x.data[j]['t'] = new Date(old + off);
			}

			plot.data.datasets.push(x);
			plot.update();
		});
	})
	.fail(function()
	{
		$('#graph').html('<center>Brak danych do załadowania</center>');
	});

	$.when($.getJSON('temps.json', onTemps))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'temps.json', onTemps);
	})
	.fail(function()
	{
		$('#temps').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('system.json', onSystem))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'system.json', onSystem);
	})
	.fail(function()
	{
		$('#system').html('Błąd w ładowaniu danych');
	});
}

function onTemps(data)
{
	var table = '<table><tr><th>Miejsce</th><th>Wartość</th>';
	var keys = Object.keys(data).sort();
	var temp = null;

	var i = keys.indexOf('Obliczona');
	if (i != -1)
	{
		keys.splice(i, 1);
		keys.unshift('Obliczona');
	}

	var j = keys.indexOf('Zewnętrzna');
	if (j != -1)
	{
		keys.splice(j, 1);
		keys.push('Zewnętrzna');
	}

	for (const k in keys)
	{
		temp = data[keys[k]];

		if (!Number.isFinite(temp)) temp = 'Brak danych';
		else temp = Number(temp).toFixed(1) + ' ℃';

		table += `<tr><td>${keys[k]}</td><td>${temp}</td></tr>`;
	}

	$('#temps').html(table + '</table>');
}

function onSystem(data)
{
	var table = '<table><tr><th>Parametr</th><th>Wartość</th>';
	var temp = null;

	for (const k in data)
	{
		if (data[k] != null) temp = data[k];
		else temp = 'Brak danych';

		table += `<tr><td>${k}</td><td>${temp}</td></tr>`;
	}

	$('#system').html(table + '</table>');
}

function onEnable(param)
{
	if (set_locked) return;
	else set_locked = true;

	showToast('Łączenie z urządzeniem...', 0);

	$.when($.get('config', { power: param }))
	.done(function()
	{
		$.getJSON('system.json', onSystem);
		showToast('Sterowanie zaktualizowane', 5000);

		set_locked = false;
	})
	.fail(onError);
}

function onDriver(param)
{
	if (set_locked) return;
	else set_locked = true;

	showToast('Łączenie z urządzeniem...', 0);

	$.when($.get('config', { driver: param }))
	.done(function()
	{
		$.getJSON('system.json', onSystem);
		showToast('Sterowanie zaktualizowane', 5000);

		set_locked = false;
	})
	.fail(onError);
}

function onError()
{
	showToast('Nie udało się wykonać zapytania', 5000);
	set_locked = false;
}
