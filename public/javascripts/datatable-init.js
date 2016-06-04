$(document).ready(function() {
    $('.data-table').DataTable({
    	dom: 'Bfrtip',
    	buttons: ['copy', 'excel', 'pdf', 'print']
    });
});