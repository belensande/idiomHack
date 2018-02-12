$(document).ready(function () {
	$('.list-group-item').on('click', function () {
		$(this).toggleClass('active');
	})
});

function submitMyForm() {
	let languagesOffered = [];
	$('#languagesOffered li.active').each(function() {
		languagesOffered.push($(this).prop('id'));
	});
	$('#hiddenLanguagesOffered').val(JSON.stringify(languagesOffered));

	let languagesDemanded = [];
	$('#languagesDemanded li.active').each(function () {
		languagesDemanded.push($(this).prop('id'));
	});
	$('#hiddenLanguagesDemanded').val(JSON.stringify(languagesDemanded));

	$('form').submit();
}