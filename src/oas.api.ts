import { HttpClientModule, HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';

export class oas_core
{

	public constructor(private http: HttpClient)
	{

	}

	public loading: boolean = false;
	public baseURL: string = "https://api.orionadvisor.com/api/v1";

	////////////////////////////////////////////////////////////////
	// Performance ennhancing Value Cache

	private memoryStorage: Map<string,any> = new Map();

	private session(key: string, value?: any): any
	{
		return (
			value ? sessionStorage.setItem(key, JSON.stringify(this.memoryStorage.set(key, value).get(key))):
			this.memoryStorage.has(key) ? this.memoryStorage.get(key):
			key in sessionStorage ? this.memoryStorage.set(key, JSON.parse(sessionStorage.getItem(key))).get(key):
			null
		);
	}

	private sessionDelete(key: string): void
	{
		sessionStorage.removeItem(key);
		this.memoryStorage.delete(key);
	}

	private local(key: string, value?: any): any
	{
		return (
			value ? localStorage.setItem(key, JSON.stringify(this.memoryStorage.set(key, value).get(key))):
			this.memoryStorage.has(key) ? this.memoryStorage.get(key):
			key in localStorage ? this.memoryStorage.set(key, JSON.parse(localStorage.getItem(key))).get(key):
			null
		);
	}

	private localDelete(key: string): void
	{
		localStorage.removeItem(key);
		this.memoryStorage.delete(key);
	}

	////////////////////////////////////////////////////////////////
	// Public Get/Set
	
	public get username(): string { return this.local('oas_username'); }
	public set username(value: string) { this.local('oas_username', value); }

	public get password(): string { return this.local('oas_password'); }
	public set password(value: string) { this.local('oas_password', value); }

	public get token(): string { return this.local('oas_token'); }
	public set token(value: string) { this.local('oas_token', value); }

	public get deviceId(): string { return this.local('oas_device_id'); }
	public set deviceId(value: string) { this.local('oas_device_id', value); }
	
	public get database(): number { return this.local('database'); }
	public set database(value: number) { this.local('database', value); }

	public get databases(): Array<database> { return this.local('databases'); }
	public set databases(value: Array<database>) { this.local('databases', value); }
	
	public get domain(): string { return this.local('domain'); }
	public set domain(value: string)
	{
		this.local('domain', value); 
		this.endpoint = (this.domain in this.endpoints) ? this.endpoints[this.domain][0] : "";
	}

	public get endpoint(): string { return this.local('endpoint'); }
	public set endpoint(value: string)
	{ 
		this.local('endpoint', value); 
		this.method = (this.domain in this.endpoints && this.endpoint in this.endpoints[this.domain]) ? this.endpoints[this.domain][this.endpoint][0] : "";
		this.varList = this.vars;
	}

	public get endpoints(): any { return this.local('endpoints'); }
	public set endpoints(value: any) { this.local('endpoints', value); }
	
	public get method(): string { return this.local('method'); }
	public set method(value: string) { this.local('method', value); }

	public get varList(): Array<any> { return this.local('varList'); }
	public set varList(value: Array<any>) { this.local('varList', value); }
	
	public get path(): string
	{
		if (!this.baseURL || !this.domain || !this.endpoint) return "";
		var p: string = `/${this.domain}/${this.endpoint}`;
		for (let m of this.varList||[]) p = p.replace(RegExp(`\{${m.name}.*?\}`), encodeURIComponent(m.value));
		return p;
	}

	private get vars(): Array<any>
	{
		var s: string = this.endpoint;
		var rxm: RegExpMatchArray, rxr = [], rxp: RegExp = /\{(.*?)\}/g;
		while (rxm = rxp.exec(s))
		{
			let m = rxm[1].split(":");
			rxr.push({name: m[0], type: m[1] || "any", value: ""})
		}
		return rxr;
	}

	////////////////////////////////////////////////////////////////
	// Primary functions

	public async call(body?: string): Promise<any>
	{
		return await this.request(this.method, this.path, body);
	}

	public async request(method: string, path: string, options: any = {}, body?: string): Promise<any>
	{
		this.loading = true;
		try
		{
			var res: any;
			res = await this.http.request(method, `${this.baseURL}${path}`,
				Object.assign({headers: {authorization: "Session " + this.token}}, options)
			).toPromise();

			this.loading = false;
			return res;
		}
		catch(e)
		{
			if (e.status == 401) this.logout();
			
			console.log("ERROR!");
			console.log(e);

			this.loading = false;
			return null;
		}
	}
	
	public async login(): Promise<void>
	{
		var res: token = await this.request("GET","/security/token", {headers:{authorization:"Basic " + btoa(`${this.username}:${this.password}`)}});
		if (res)
		{
			this.token = res.access_token;
			this.getDatabases();
			this.getEndpoints();
		}
	}

	public logout(): void
	{
		this.localDelete('database');
		this.localDelete('oas_token');
		
	}
	
	public async getEndpoints(): Promise<void>
	{
		var res: kvp = {};
		var ep2: Array<endpoints2> = await this.request("GET", "/Security/Endpoints2");
		for (let ep of ep2)
		{
			let r: Array<string> = ep.fullRoute.split("/").slice(1);
			let d: string = r.shift();
			let p: string = r.join("/");
			if (!(d in res)) res[d] = {};
			res[d][p] = ep.methods.flatMap(o=>o.verbs);
			if (res[d][p].length == 0) res[d][p].push("GET");
		}
		this.endpoints = res;
	}

	public async getDatabases(): Promise<void>
	{
		this.databases = await this.request("GET", "/Authorization/Databases");
		this.database = this.databases.find(o=>o.selected).id;
	}
	
	public async switchDatabase(): Promise<void>
	{
		let headers = new HttpHeaders()
			.set("authorization", "Switch " + this.token)
			.set("alclientid", String(this.database));

		var res: token = await this.request("GET", "/security/token", {headers});
		this.token = res.access_token;
	}


}

/****************************************************************\
| Interfaces
\****************************************************************/

export interface kvp
{
	[key: string]: any;
} 

export interface token
{
	access_token: string;
	expires_in: number;
}

export interface database
{
	id: number;
	clientName: string;
	selected: boolean;
	lockDown: string;
	ops: any;
}

export interface endpoints2
{
	fullRoute: string;
	methods: Array<endpoints2_method>;
}

export interface endpoints2_method
{
	verbs: Array<string>;
	security: endpoints2_method_security;
	allowAnonymous: boolean;
}

export interface endpoints2_method_security
{

	permissionsAreNotRequired: boolean;
	resourceSecurity: endpoints2_method_security_resourceSecurity;
	roles: string;
	typeId: any,
	users: string;
	allowMultiple: boolean;
}

export interface endpoints2_method_security_resourceSecurity
{
	permissionsIsNotRequired: boolean;
	permissions: Array<endpoints2_method_security_resourceSecurity_permissions>;
}

export interface endpoints2_method_security_resourceSecurity_permissions
{
	resource: string;
	accessType: string;
}
