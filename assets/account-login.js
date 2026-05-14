    	function showRecoverPasswordForm() {
		document.getElementById('recover_password').style.display = 'block';
		// hide the full login wrapper instead of just the form so only one panel shows
		const wrapper = document.querySelector('.login-wrapper');
		if (wrapper) wrapper.style.display = 'none';
	}

	function hideRecoverPasswordForm() {
		document.getElementById('recover_password').style.display = 'none';
		const wrapper = document.querySelector('.login-wrapper');
		if (wrapper) wrapper.style.display = 'grid';
	}

	if (window.location.hash == '#recover') { 
		showRecoverPasswordForm();
	}