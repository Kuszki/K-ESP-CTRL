function onLoad()
{
	$.ajaxSetup({ 'timeout': 5000 });

	$.when($.getJSON('devinfo.json', onDevinfo))
	.done(function()
	{
		setInterval($.getJSON, 30000, 'devinfo.json', onDevinfo);
	})
	.fail(function()
	{
		$('#dev').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('system.json', onSystem))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'system.json', onSystem);
	})
	.fail(function()
	{
		$('#sta').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('temps.json', onTemps))
	.done(function()
	{
		setInterval($.getJSON, 30000, 'temps.json', onTemps);
	})
	.fail(function()
	{
		$('#tmp').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('prefs.json', onRaw))
	.done(function()
	{
		setInterval($.getJSON, 60000, 'prefs.json', onRaw);
	})
	.fail(function()
	{
		$('#raw').html('Błąd w ładowaniu danych');
	});
}

function onDevinfo(data)
{
	var table = '<table>';
	var keys = Object.keys(data).sort();
	var temp = null;

	for (const i in keys)
	{
		const k = keys[i];

		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`;
	}

	$('#dev').html(table + '</table>');
}

function onSystem(data)
{
	var table = '<table>';
	var keys = Object.keys(data).sort();
	var temp = null;

	for (const i in keys)
	{
		const k = keys[i];

		if (data[k] != null) temp = data[k].toString();
		else temp = 'Brak danych';

		const p = k.charAt(0).toUpperCase() + k.slice(1);
		const v = temp.charAt(0).toUpperCase() + temp.slice(1);

		table += `<tr><td>${p}</td><td>${v}</td></tr>`;
	}

	$('#sta').html(table + '</table>');
}

function onTemps(data)
{
	var table = '<table>';
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

	$('#tmp').html(table + '</table>');
}

function onRaw(data)
{
	var table = '<table>';
	var keys = Object.keys(data).sort();
	var temp = null;

	for (const i in keys)
	{
		const k = keys[i];

		table += `<tr><td>${k}</td><td>${data[k]}</td></tr>`;
	}

	$('#raw').html(table + '</table>');
}
