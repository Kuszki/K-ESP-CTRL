var set_hiding = null;

function showToast(msg, time)
{
	var x = document.getElementById("toast");

	clearTimeout(set_hiding);
	x.innerHTML = msg;
	x.className = "show";

	if (time)
	{
		set_hiding = setTimeout(function()
		{
			x.className = "hide";

			setTimeout(function()
			{
				x.className = "";
			}, 1000);
		}, time);
	}
}

function hideToast()
{
	var x = document.getElementById("toast");

	clearTimeout(set_hiding);
	x.innerHTML = msg;
	x.className = "hide";

	setTimeout(function()
	{
		x.className = "";
	}, 1000);
}
