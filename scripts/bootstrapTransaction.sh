set -x
composer transaction submit  -n todolist-network -p hlfv1 -i admin -s adminpw -d "{\"\$class\": \"org.example.todolist.Bootstrap\",\"txnId\": \"BOOTSTRAP\"}"
