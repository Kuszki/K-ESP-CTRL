function onLoad()
{
	$.when($.getJSON('log.json', onLogs))
	.done(function(config, data)
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
	var off = (new Date(2000, 0, 1)) - (new Date(0));
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
	// TODO
}
