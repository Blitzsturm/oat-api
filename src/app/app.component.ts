import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { oas_core, database } from '../oas.api';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent
{
	/****************************************************************\
	| Variables
	\****************************************************************/

	public oas: oas_core = new oas_core(this.http);
	public res: string = "";

	////////////////////////////////////////////////////////////////
	// UI Binds

	public get loggedIn()
	{
		return Boolean(this.oas.token);
	}

	public get databases(): Array<database>
	{
		return this.oas.databases || [];
	}

	public get domains(): Array<string>
	{
		return Object.keys(this.oas.endpoints || {}).sort();
	}

	public get endpoints(): Array<string>
	{
		//if (!this.oas.endpoints || !this.oas.domain) return [];
		try{
		return Object.keys(this.oas.endpoints[this.oas.domain]||{}).sort();
		}catch(e){return []}
	}

	public get methods(): Array<string>
	{
		//if (!this.oas.endpoints || !this.oas.domain || !this.oas.endpoint) return [];
		try{
		return this.oas.endpoints[this.oas.domain][this.oas.endpoint] || [];
		}catch(e){return []}
	}

	public get body():any
	{
		return JSON.parse(this.res);
	}

	public set body(value: any)
	{
		this.res = JSON.stringify(value, null, "    ");
	}

	/****************************************************************\
	| Internals
	\****************************************************************/

	public constructor(private sanitizer: DomSanitizer, private http: HttpClient)
	{
		globalThis.app = this;
	}

	private async ngOnInit(): Promise<void>
	{
		//await this.apiGet();
	}

	
	public async LoadURL()
	{
		this.body = await this.oas.call(/^p/i.test(this.oas.method) ? this.res : null);
	}

}
