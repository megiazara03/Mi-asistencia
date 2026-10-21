# 6. Generar automaticamente el inventario de Ansible para v2
resource "local_file" "ansible_inventory" {
  filename = "${path.module}/../ansible/inventory.ini"
  content  = <<-EOT
[backend]
backend-server ansible_host=${aws_instance.backend.public_ip} private_ip=${aws_instance.backend.private_ip}

[frontend]
%{if var.crear_frontend~}
frontend-server ansible_host=${aws_instance.frontend[0].public_ip}
%{endif~}

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/${var.proyecto}-llave.pem
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
repo_url="${var.repo_url}"
repo_rama="${var.repo_rama}"
app_dir="/opt/${var.proyecto}"
app_user="${var.proyecto}"
db_name="${var.proyecto}"
db_user="${var.proyecto}"
db_password="${random_password.db.result}"
jwt_secret="${random_password.jwt.result}"
admin_email="${var.admin_email}"
admin_password="${var.admin_password}"
  EOT
}

