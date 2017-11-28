set -x
composer transaction submit --card admin@todolist-network --data "{\"\$class\": \"org.example.todolist.Bootstrap\"}"
