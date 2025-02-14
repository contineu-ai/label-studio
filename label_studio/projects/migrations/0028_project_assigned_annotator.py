# Generated by Django 4.2.15 on 2024-09-06 11:00

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0027_project_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='assigned_annotator',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_projects', to=settings.AUTH_USER_MODEL, verbose_name='assigned_annotator'),
        ),
    ]
