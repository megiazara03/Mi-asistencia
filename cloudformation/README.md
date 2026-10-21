# Despliegue con AWS CloudFormation — Sistema de Asistencia

Este directorio contiene los templates de **AWS CloudFormation** para desplegar la infraestructura en la nube de forma automatizada y modular.

---

## 📁 Estructura Modular

```text
cloudformation/
├── main.yaml                   # Plantilla principal modular (orquesta módulos anidados)
├── standalone-template.yaml    # Plantilla completa autónoma (ideal para consola web directa)
├── parameters.json.example     # Ejemplo de parámetros para la AWS CLI
├── modules/
│   ├── security.yaml           # Grupos de seguridad (Frontend SG y Backend SG)
│   ├── backend.yaml            # VM Backend (Node.js 20 + MySQL 8 + systemd)
│   └── frontend.yaml           # VM Frontend (React/Vite + Nginx reverse proxy)
└── README.md
```

---

## 🛠 Requisitos Previos

1. **AWS CLI v2** configurado con tus credenciales:
   ```bash
   aws configure
   ```
2. **Key Pair (Par de llaves SSH)** creado previamente en la consola de AWS EC2 o vía CLI:
   ```bash
   aws ec2 create-key-pair --key-name asistencia-key --query "KeyMaterial" --output text > asistencia-key.pem
   ```
3. **Identificar los IDs de red:**
   * **VPC ID** (por defecto o personalizada):
     ```bash
     aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
     ```
   * **Subnet ID** pública:
     ```bash
     aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --query "Subnets[0].SubnetId" --output text
     ```
   * **AMI Ubuntu 24.04 LTS** en tu región (ej. `us-east-1` suele ser `ami-04b4f1a9cf54c11d0`):
     ```bash
     aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" --output text
     ```

---

## 🚀 Despliegue

### Opción A: Despliegue Modular con `aws cloudformation package` (Recomendado)

Dado que `main.yaml` utiliza módulos anidados locales (`./modules/security.yaml`, `./modules/backend.yaml`, `./modules/frontend.yaml`), CloudFormation requiere empaquetarlos en un bucket S3 temporal antes de desplegar:

1. **Crear bucket temporal para plantillas (si no tienes uno):**
   ```bash
   aws s3 mb s3://asistencia-cfn-templates-tu-cuenta
   ```

2. **Empaquetar los módulos:**
   ```bash
   aws cloudformation package \
     --template-file main.yaml \
     --s3-bucket asistencia-cfn-templates-tu-cuenta \
     --output-template-file packaged-main.yaml
   ```

3. **Desplegar el stack:**
   ```bash
   aws cloudformation deploy \
     --template-file packaged-main.yaml \
     --stack-name stack-asistencia \
     --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
     --parameter-overrides \
         VpcId=vpc-xxxxxxxx \
         SubnetId=subnet-xxxxxxxx \
         KeyName=asistencia-key \
         AmiId=ami-xxxxxxxx \
         MiIp=$(curl -s ifconfig.me)/32
   ```

---

### Opción B: Despliegue con Plantilla Única (`standalone-template.yaml`)

Si prefieres no usar un bucket S3 y subir el archivo directamente desde la **Consola Web de AWS** o desplegar en un solo comando:

```bash
aws cloudformation deploy \
  --template-file standalone-template.yaml \
  --stack-name stack-asistencia \
  --parameter-overrides \
      VpcId=vpc-xxxxxxxx \
      SubnetId=subnet-xxxxxxxx \
      KeyName=asistencia-key \
      AmiId=ami-xxxxxxxx
```

O desde la Consola AWS:
1. Ve a **CloudFormation** → **Create stack** → *With new resources (standard)*.
2. Selecciona **Upload a template file** y sube [standalone-template.yaml](file:///c:/Users/Usuario/Documents/m2/Mi-asistencia/cloudformation/standalone-template.yaml).
3. Llena los parámetros solicitados y pulsa **Submit**.

---

## 🌐 Verificación y Outputs

Una vez finalizado el stack (`CREATE_COMPLETE`), obtén las URLs públicas:

```bash
aws cloudformation describe-stacks \
  --stack-name stack-asistencia \
  --query "Stacks[0].Outputs" \
  --output table
```

Obtendrás:
- **`AppUrl`**: `http://<IP-FRONTEND>` (Aplicación web React servida por Nginx).
- **`BackendApiUrl`**: `http://<IP-BACKEND>:8000/api/health` (Health check del backend Node/Express).

---

## 🧹 Eliminar Recursos

Para dar de baja todos los recursos y evitar costos:
```bash
aws cloudformation delete-stack --stack-name stack-asistencia
```
