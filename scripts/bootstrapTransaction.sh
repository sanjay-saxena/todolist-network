set -x
composer transaction submit  -n todolist-network -p hlfv1 -i PeerAdmin -s adminpw -d "{\"\$class\": \"org.example.todolist.Bootstrap\"}"
