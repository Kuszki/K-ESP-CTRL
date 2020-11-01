function onLoad()
{

	var colors = ['red', 'blue', 'green'];

	$.when
	(
		$.getJSON('plot.json'),
		$.getJSON('history.json')
	)
	.done(function(config, data)
	{
		ctx = $('#plot')[0].getContext('2d');
		plot = new Chart(ctx, config[0]);

		for (i = 0; i < data[0].length; ++i)
		{
			data[0][i].borderColor = colors[i];
			data[0][i].fill = false;
		}

		plot.data.datasets = data[0];
		plot.update()
	})
	.fail(function()
	{
		$('#graph').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('temps.json', onTemps))
	.done(function()
	{
		//setInterval($.getJSON, 10000, 'temps.json', onTemps);
	})
	.fail(function()
	{
		$('#temps').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('system.json', onSystem))
	.done(function()
	{
		//setInterval($.getJSON, 10000, 'system.json', onSystem);
	})
	.fail(function()
	{
		$('#system').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('outdor.json', onOutdor))
	.done(function()
	{
		//setInterval($.getJSON, 10000, 'outdor.json', onOutdor);
	})
	.fail(function()
	{
		$('#outdor').html('Błąd w ładowaniu danych');
	});
}

function onTemps(data)
{
	var table = '<table><tr><th>Miejsce</th><th>Wartość</th>';

	for (const k in data)
	{
		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`
	}

	$('#temps').html(table + '</table>');
}

function onSystem(data)
{
	var table = '<table><tr><th>Parametr</th><th>Wartość</th>';

	for (const k in data)
	{
		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`
	}

	$('#system').html(table + '</table>');
}

function onOutdor(data)
{
	var table = '<table><tr><th>Informacja</th><th>Wartość</th>';

	for (const k in data)
	{
		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`
	}

	$('#outdor').html(table + '</table>');
}

function onEnable(param)
{
	$.when($.get("config", { power: param }))
	.done($.getJSON('system.json', onSystem))
	.fail(onError);
}

function onDriver(param)
{
	$.when($.get("config", { driver: param }))
	.done($.getJSON('system.json', onSystem))
	.fail(onError);
}

function onError()
{
	alert("Nie udało się przetworzyć zapytania");
}
