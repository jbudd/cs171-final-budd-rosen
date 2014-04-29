// $(document).ready(function() { });

$(function() {
	$("#modal").easyModal({
		top: 100,
		autoOpen: true,
		overlayOpacity: 0.3,
		overlayColor: "#333",
		overlayClose: false,
		closeOnEscape: false
	});

	$("#close").click(function(){ $("#modal").trigger("closeModal"); });
});

