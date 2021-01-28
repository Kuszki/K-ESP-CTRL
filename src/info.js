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

	$.when($.getJSON('timing.json', onTimes))
	.done(function()
	{
		setInterval($.getJSON, 90000, 'timing.json', onTimes);
	})
	.fail(function()
	{
		$('#raw').html('Błąd w ładowaniu danych');
	});

	$.when($.getJSON('updates.json', onTemps))
	.done(function()
	{
		setInterval($.getJSON, 30000, 'updates.json', onTemps);
	})
	.fail(function()
	{
		$('#tmp').html('Błąd w ładowaniu danych');
	});
}

function onDevinfo(data)
{
	$('#dev').html(onDatatab(data));
}

function onSystem(data)
{
	$('#sta').html(onDatatab(data));
}

function onTimes(data)
{
	$('#syn').html(onTimetab(data));
}

function onTemps(data)
{
	$('#tmp').html(onTimetab(data));
}

function onSave()
{
	var f = document.getElementById('informations');
	var txt = f.innerText;

	var uriContent = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
	var newWindow = window.open(uriContent, 'k-esp-ctrl-info.txt');
}

function onTimetab(data)
{
	var table = '<table>';
	var keys = Object.keys(data).sort();
	var temp = null;

	const off = Date.UTC(2000, 0, 1);

	for (const k in keys)
	{
		temp = data[keys[k]];

		const time = new Date(temp * 1000 + off);
		const sdate = time.toLocaleString('pl');
		const v = temp != 0 ? sdate : '-'.repeat(32);

		table += `<tr><td>${keys[k]}</td><td>${v}</td></tr>`;
	}

	return table + '</table>';
}

function onDatatab(data)
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

	return table + '</table>';
}
