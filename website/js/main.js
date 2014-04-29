// $(document).ready(function() { });

// $(window).load(function(){ });

$(function() {
	$("#modal").easyModal({
		top: 100,
		autoOpen: true,
		overlayOpacity: 0.4,
		overlayColor: "#333",
		overlayClose: false,
		closeOnEscape: false
	});

	$("#close").click(function(){ $("#modal").trigger("closeModal"); });
});

