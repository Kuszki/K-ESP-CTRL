const messages =
{
	'pwr':
	{
		false: 'Wyłączono ogrzewanie',
		true: 'Włączono ogrzewanie'
	},
	'drv':
	{
		0: 'Ustawiono sterowanie ręczne',
		1: 'Ustawiono sterowanie automatyczne'
	},
	'boot':
	{
		1: 'Włączono sterownik',
		2: 'Zrestartowano sterownik',
		3: 'Zrestartowano sterownik',
		4: 'Obudzono sterownik',
		5: 'Zrestartowano sterownik'
	}
}

const errors =
{
	'clr': 'Nie udało się usunąć historii',
};

var firstload = true;

function onLoad()
{
	$.ajaxSetup({ 'timeout': 5000 });

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
	const now = (new Date() - off) / 1000;

	var table = '', num = 0, found = false, days = {};

	data.sort(function(a, b)
	{
		if (a.t > b.t) return -1;
		if (a.t < b.t) return 1;
		return 0;
	});

	for (var i = 0; i < data.length; ++i)
	{
		if (data[i].k != 'pwr') continue;

		if (!found) data[i].d = now - data[i].t;
		else for (var j = i-1; j >= 0 && data[i].d == null; --j)
		{
			if (data[j].k != 'pwr') continue;
			else data[i].d = data[j].t - data[i].t;
		}

		data[i].d = Math.floor(data[i].d / 60);
		found = true;
	}

	for (const k in data)
	{
		const secs = data[k].t + (diff / 1000);
		const day = secs - (secs % 86400);
		const next = day + 86400;

		const date = new Date(day * 1000 + off);
		const sdate = date.toLocaleDateString('pl', options);

		if (days.hasOwnProperty(sdate))
		{
			days[sdate].push(data[k]);
		}
		else
		{
			days[sdate] = [ data[k] ];
		}
	}

	for (const k in days)
	{
		var times = 0.0, found = false, minus = 0.0;

		if (!firstload || !num) ++num;
		else { hidden.push(k); ++num; }

		for (var j = days[k].length - 1; j >= 0; --j)
		{
			if (days[k][j].k != 'pwr') continue;

			const secs = days[k][j].t + (diff / 1000);
			const day = secs - (secs % 86400);
			const next = day + 86400;

			const dur = days[k][j].d;
			const durs = dur * 60;

			if (days[k][j].s)
			{
				if (secs + durs <= next) minus = 0;
				else minus = (secs + durs - next) / 60;

				times += dur - Math.floor(minus);
			}
			else
			{
				if (found) minus = 0.0;
				else minus = (secs - day) / 60

				times += Math.floor(minus);
			}

			found = true;
		}

		const hd = hidden.indexOf(k) == -1 ? "on" : "hide";
		const uk = k.charAt(0).toUpperCase() + k.slice(1);
		const stip =
		(
			times <= 1 ? '' : 'Czas włączenia: ' +
				Math.floor(times / 60) + 'h ' +
				Math.floor(times % 60) + 'm'
		);

		table += `<p title="${stip}" onclick="onExpand('${k}')">${uk}</p>`;
		table += `<table id="${k}" class="${hd}">`;

		for (const j in days[k])
		{
			const item = days[k][j];

			const time = new Date(item.t * 1000 + off);
			const sdate = time.toLocaleTimeString('pl');

			const msg = messages[item.k][item.s];
			const tip =
			(
				item.d == null ? '' : 'Czas trwania: ' +
					Math.floor(item.d / 60) + 'h ' +
					Math.floor(item.d % 60) + 'm'
			);

			table += `<tr title="${tip}">`
			table += `<td>${sdate}</td><td>${msg}</td>`
			table += `</tr>`;
		}

		table += `</table>`;
	}

	$('#log').html(table);
	firstload = false;
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
	.done(function(msg)
	{
		if (msg != "True") { onError(); return; }

		$('#log').html('<table></table>');
		showToast('Usunięto historię zdarzeń', 5000);

		set_locked = false;
	})
	.fail(function()
	{
		onError('clr');
	});
}
