# Generated by Django 3.2.12 on 2022-04-13 11:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('poem', '0020_servicetype_fields_extend'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='metric',
            name='tags',
        ),
    ]
