# Ansible — Guia rapida

Tanto Ansible como sus playbooks se ejecutan desde **WSL (Ubuntu)**, ya que Ansible controller se ejecuta en entornos Linux.

---

## 1. Configurar IPs en el Inventario

Abre [inventory.ini](file:///c:/Users/Usuario/Documents/m2/Mi-asistencia/ansible/inventory.ini) y define la IP de tu servidor backend o frontend (las que te da Terraform al hacer `terraform apply`):

```ini
[backend]
ec2-backend ansible_host=54.210.XX.XX ansible_ssh_private_key_file=../infra/mi-asistencia-llave.pem

[frontend]
ec2-frontend ansible_host=34.200.YY.YY ansible_ssh_private_key_file=../infra/mi-asistencia-llave.pem
```

> **Nota sobre permisos de la llave PEM en WSL**:
> Antes de conectar por SSH desde WSL, dale permisos 400:
> ```bash
> chmod 400 ../infra/mi-asistencia-llave.pem
> ```

---

## 2. Probar conectividad (Ping)

Desde una terminal en WSL (o PowerShell usando `wsl`):

```bash
cd /mnt/c/Users/Usuario/Documents/m2/Mi-asistencia/ansible
ansible-playbook ping.yml
```

---

## 3. Aprovisionar Backend (MySQL 8 + Node.js 20)

```bash
ansible-playbook playbook-backend.yml
```
