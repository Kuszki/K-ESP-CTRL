var set_locked = false;

function onLoad()
{
	$.ajaxSetup({ 'timeout': 2500 });

	$.when($.getJSON('log.json', onLogs))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'log.json', onLogs);
	})
	.fail(function()
	{
		$('#log').html('<p>Brak danych do załadowania</p>');
	});
}

function onLogs(data)
{
	var off = Date.UTC(2000, 0, 1);
	var table = '<table>';

	for (const k in data)
	{
		var time = new Date(data[k]['t'] * 1000 + off).toLocaleString('pl');
		var msg = data[k]['msg']

		table += `<tr><td>${time}</td><td>${msg}</td></tr>`
	}

	$('#log').html(table + '</table>');
}

function onSave()
{
	var f = document.getElementById('log');
	var txt = f.innerText;

	var uriContent = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
	var newWindow = window.open(uriContent, 'k-esp-ctrl-log.txt');
}

function onClear()
{
	if (set_locked) return;
	else set_locked = true;

	$.when($.get('config', { 'rmlogs': true }))
	.done(function()
	{
		$('#log').html('<table></table>');

		showToast('Usunięto historię zdarzeń', 5000);
		set_locked = false;
	})
	.fail(onError);
}

function onError()
{
	showToast('Nie udało się wykonać zapytania', 5000);
	set_locked = false;
}
