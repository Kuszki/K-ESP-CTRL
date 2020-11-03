function onLoad()
{
	$.when($.getJSON('log.json', onLogs))
	.done(function()
	{
		setInterval($.getJSON, 10000, 'log.json', onLogs);
	})
	.fail(function()
	{
		$('#graph').html('<center>Błąd w ładowaniu danych</center>');
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

	var uriContent = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
	var newWindow = window.open(uriContent, 'k-esp-ctrl-log.txt');
}