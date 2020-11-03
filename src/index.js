var pl_colors = ['tomato', 'olive', 'teal', 'peru', 'coral', 'azure', 'blue'];
var set_locked = false;

function onLoad()
{

	$.when
	(
		$.getJSON('plot.json'),
		$.getJSON('history.json')
	)
	.done(function(config, data)
	{
		var off = Date.UTC(2000, 0, 1);

		ctx = $('#plot')[0].getContext('2d');
		plot = new Chart(ctx, config[0]);
		moment.locale('pl');

		for (i = 0; i < data[0].length; ++i)
		{
			data[0][i].borderColor = pl_colors[i];
			data[0][i].fill = false;

			for (j = 0; j < data[0][i].data.length; ++j)
			{
				var old = data[0][i].data[j]['t'] * 1000;
				data[0][i].data[j]['t'] = new Date(old + off);
			}
		}

		plot.data.datasets = data[0];
		plot.update()
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
		$('#temps').html('<center>Błąd w ładowaniu danych</center>');
	});

	$.when($.getJSON('system.json', onSystem))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'system.json', onSystem);
	})
	.fail(function()
	{
		$('#system').html('<center>Błąd w ładowaniu danych</center>');
	});

	$.when($.getJSON('outdor.json', onOutdor))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'outdor.json', onOutdor);
	})
	.fail(function()
	{
		$('#outdor').html('<center>Błąd w ładowaniu danych</center>');
	});
}

function onTemps(data)
{
	var table = '<table><tr><th>Miejsce</th><th>Wartość</th>';

	for (const k in data)
	{
		table += `<tr><td>${k}</td><td>${data[k]} ℃</td></tr>`;
	}

	$('#temps').html(table + '</table>');
}

function onSystem(data)
{
	var table = '<table><tr><th>Parametr</th><th>Wartość</th>';

	for (const k in data)
	{
		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`;
	}

	$('#system').html(table + '</table>');
}

function onOutdor(data)
{
	var table = '<table><tr><th>Informacja</th><th>Wartość</th>';

	for (const k in data)
	{
		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`;
	}

	$('#outdor').html(table + '</table>');
}

function onEnable(param)
{
	if (set_locked) return;
	else set_locked = true;

	showToast("Łączenie z urządzeniem...", 0);

	$.when($.get("config", { power: param }))
	.done(function()
	{
		$.getJSON('system.json', onSystem);
		showToast("Sterowanie zaktualizowane", 5000);
	})
	.fail(onError);

	set_locked = false;
}

function onDriver(param)
{
	if (set_locked) return;
	else set_locked = true;

	showToast("Łączenie z urządzeniem...", 0);

	$.when($.get("config", { driver: param }))
	.done(function()
	{
		$.getJSON('system.json', onSystem);
		showToast("Sterowanie zaktualizowane", 5000);
	})
	.fail(onError);

	set_locked = false;
}

function onError()
{
	showToast("Nie udało się wykonać zapytania", 5000);
}
