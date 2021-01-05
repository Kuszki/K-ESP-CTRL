var set_locked = false;
var hidden = [];

function onLoad()
{
	$.ajaxSetup({ 'timeout': 2500 });

	$.when($.getJSON('log.json', onLogs))
	.done(function()
	{
		setInterval($.getJSON, 60000, 'log.json', onLogs);
	})
	.fail(function()
	{
		$('#log').html('<p>Brak danych do załadowania</p>');
	});
}

function onLogs(data)
{
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

	const diff = Date.UTC(2000, 0, 1) - new Date(2000, 0, 1);
	const off = Date.UTC(2000, 0, 1);

	var table = '';
	var days = {};

	data.sort(function(a, b)
	{
		if (a.t > b.t) return -1;
		if (a.t < b.t) return 1;
		return 0;
	});

	for (const k in data)
	{
		const secs = data[k]['t'] + (diff / 1000);
		const day = secs - (secs % 86400);

		const date = new Date(day * 1000 + off);
		const sdate = date.toLocaleDateString('pl', options);

		if (days.hasOwnProperty(sdate)) days[sdate].push(data[k]);
		else days[sdate] = [ data[k] ];
	}

	for (const k in days)
	{
		const hd = hidden.indexOf(k) == -1 ? "on" : "hide";

		table += `<p onclick="onExpand('${k}')">${k}</p>`;
		table += `<table id="${k}" class="${hd}">`;

		for (const j in days[k])
		{
			const time = new Date(days[k][j]['t'] * 1000 + off);
			const sdate = time.toLocaleTimeString('pl');
			const msg = days[k][j]['msg'];

			table += `<tr><td>${sdate}</td><td>${msg}</td></tr>`;
		}

		table += `</table>`;
	}

	$('#log').html(table);
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

function onExpand(tree)
{
	var e = document.getElementById(tree);
	if (e != null) if (e.className == 'hide')
	{
		e.className = 'off';
		setTimeout(function()
		{
			const i = hidden.indexOf(tree);
			if (i != -1) hidden.splice(i, 1);

			e.className = 'on';
		}, 150);
	}
	else
	{
		e.className = 'off';
		setTimeout(function()
		{
			const i = hidden.indexOf(tree);
			if (i == -1) hidden.push(tree);

			e.className = 'hide';
		}, 1000);
	}
}
