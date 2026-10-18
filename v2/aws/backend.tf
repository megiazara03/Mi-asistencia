# Ojo: dentro de un bloque backend NO se pueden usar variables.
# Copia aquí los valores que mostró "terraform output" al ejecutar v3/bootstrap/aws.
terraform {
  backend "s3" {
    bucket         = "asistencia-tfstate-i1uh0e57"
    key            = "mi-asistencia/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "asistencia-tfstate-locks"
    encrypt        = true
    role_arn       = "arn:aws:iam::838115390516:role/RolTerraformColaborador"
    
  }
}
